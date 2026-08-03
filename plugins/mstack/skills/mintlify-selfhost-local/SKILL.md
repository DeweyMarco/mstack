---
name: mintlify-selfhost-local
description: Run Mintlify's entire self-host pipeline (ingest, shard render, static export) plus the docs editor fully locally with no cloud dependencies, using the `selfhost-local` tool in mint/tools/selfhost-local. Use when reproducing self-host or git-proxy render failures, developing against the static-export pipeline, testing the docs editor's publish → git → re-render loop, or when the user mentions `pnpm local` commands, gitfarm-sim, edge preview at demo.localhost:4173, ministack/minio, or wants the real server + update-worker wiring instead of mocks. Keywords: selfhost, self-host, selfhost-local, pnpm local up, seed, trigger, git-init, static export, editor, gitfarm.
---

# Fully local Mintlify dev setup (selfhost-local)

The `selfhost-local` tool boots the whole self-host stack against local containers and a fake gitfarm, so you can exercise the real ingest → render → export → edit → publish loop without touching AWS, real gitfarm, or a deployed environment. It lives in the `mint` repo at `tools/selfhost-local`.

Use it for reproducing self-host / git-proxy render bugs, developing against the static-export pipeline, and testing the docs editor end to end. It is an integration harness that stands up server, update-worker, gitfarm-sim, and editor on one machine. It does not replace unit tests.

Docs source: https://kb.mintlify.com (full index at https://kb.mintlify.com/llms.txt)

## Local paths on this machine

- Run all `pnpm local` commands from `/Users/marcodewey/mintlify/mint-selfhost/tools/selfhost-local`. This is a dedicated `mint` worktree kept detached on `origin/main` purely for this tool, so feature work in `/Users/marcodewey/mintlify/mint` stays untouched.
- server: `/Users/marcodewey/mintlify/server` — still resolved as a sibling from inside the worktree (`../../../server`), so no `SELFHOST_SERVER_DIR` needed.
- Deps are already installed in the worktree's tool dir, and `pnpm local doctor` passes green (docker, node, server repo, env).

`tools/selfhost-local` landed on `main` in July 2026 and is missing from older feature branches, which is why the worktree exists. Do not switch `/Users/marcodewey/mintlify/mint` branches to reach the tool.

To pull in newer `main`:

```bash
git -C /Users/marcodewey/mintlify/mint fetch origin
git -C /Users/marcodewey/mintlify/mint-selfhost checkout --detach origin/main
```

If the worktree is gone, recreate it:

```bash
git -C /Users/marcodewey/mintlify/mint worktree add /Users/marcodewey/mintlify/mint-selfhost origin/main --detach
cd /Users/marcodewey/mintlify/mint-selfhost/tools/selfhost-local && pnpm i
```

Related: the `mintlify-e2e-server-client` skill covers the lighter-weight flow (local server + real dev data, no containers). Reach for this one when you need the full self-host pipeline.

## Quick start

Five commands from the tool dir (`mint-selfhost/tools/selfhost-local`) take you from nothing to a rendered site. Every command is idempotent, so re-running is safe. Run them in order and stop to show the output if any step fails.

```bash
pnpm i                       # first time only
pnpm local doctor            # verify docker, node, server repo, env; fix anything red first
pnpm local up                # infra containers + server + update-worker; wait for the "ready" line
pnpm local seed demo         # create org/user/deployment, pointed at gitfarm-sim
pnpm local trigger demo -w   # fire a build, follow it live, capture a report
pnpm local open demo         # rendered site at http://demo.localhost:4173
```

To test the editor next:

```bash
pnpm local git-init demo     # promote the fixture to a real git repo
pnpm local dashboard         # admin dashboard at :9330
# editor UI runs on the product-dashboard at http://localhost:3300
```

While debugging, use `pnpm local status` and `pnpm local logs <service>` (`server`, `update-worker`, `gitfarm-sim`, `hocuspocus`). `pnpm local down` stops services; add `--infra` to stop the containers too. Do not touch files outside `tools/selfhost-local` without asking first.

## URLs at a glance

| What you open                               | URL                                                              |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Rendered docs site                          | `http://demo.localhost:4173` (any seeded `<sub>.localhost:4173`) |
| Docs editor                                 | `http://localhost:3300`                                          |
| Admin dashboard                             | `http://localhost:9330`                                          |
| Server API                                  | `http://127.0.0.1:5000`                                          |
| gitfarm-sim (fake gitfarm)                  | `http://127.0.0.1:9326`                                          |
| minio (S3)                                  | `http://127.0.0.1:9000`                                          |
| ministack (LocalStack: SQS, CloudFront KVS) | `http://127.0.0.1:4566`                                          |

## When to reach for this

- Reproducing a self-host or git-proxy render failure that only shows up in the ingest → shard → export path.
- Developing against the static-export pipeline (shard concurrency, retries, edge preview).
- Testing the docs editor in self-host mode, including the publish → git → re-render loop.
- Any change where you want the real server and worker wiring instead of a mock.

## Prerequisites

1. **Repos side by side.** The tool resolves `server` as `../../../server` from the tool directory:

   ```text
   code/
     mint/
       tools/selfhost-local/   (you run commands here)
     server/
   ```

   If the `server` checkout lives elsewhere, `export SELFHOST_SERVER_DIR=/abs/path/to/server`.

2. **Docker running.** OrbStack or Docker Desktop must be up. It backs mongo, redis, postgres, ministack (LocalStack), and minio.

3. **Node + pnpm with private-package auth.** Install deps in both repos. If `pnpm i` 404s on private `@mintlify/*` packages, run `pnpm setup:auth` in the `server` repo first.

4. **Install tool deps.** `cd mint/tools/selfhost-local && pnpm i`.

## Full walkthrough

1. **`pnpm local doctor` (preflight).** Checks repo layout, that Docker is running, your Node version, and env drift. The env check runs the server's `envalid` schema in `selfhosted` mode and reports missing or invalid vars. Green across the board means `up` will succeed. Fix any failure before continuing.

2. **`pnpm local up` (bring the stack online).** In order, this:
   1. Starts infra containers (mongo, redis, postgres, ministack, minio) and waits for every port.
   2. Initializes the mongo replica set and creates the postgres databases (specs, usage, chat, audit).
   3. Runs `aws-init.sh`, then creates the minio S3 buckets and marks the static-render buckets public-read.
   4. Creates the FIFO workflow SQS queue in ministack.
   5. Writes a generated env file (`state/.env.selfhost-local`) and builds the server (`pnpm dev:build`).
   6. Starts the long-running services and waits for their health checks.

   Flags: `--no-build` skips the server build (fast restarts), `--skip-infra` assumes containers are already up. The stack is live once it prints its `ready` line.

3. **`pnpm local seed demo` (create a deployment).** Seeds an org, user, and deployment whose git source is git-proxy, pointed at the local gitfarm-sim (`:9326`). Subdomain defaults to `demo`; pass another name to seed a second deployment. At this point the deployment is backed by an in-memory fixture (read-only), enough to render but not yet a real repo.

4. **`pnpm local trigger demo --watch` (run a build).** POSTs to the server's internal update endpoint (authenticated with the generated `INTERNAL_TOKEN`) to kick off an update build. With `--watch` (`-w`) it follows the run live and writes a run report. Fetch it any time with `pnpm local report`.

5. **`pnpm local open demo` (view the rendered site).** Boots the edge-preview server if needed and opens `http://demo.localhost:4173`. This is the statically-exported output served exactly as the edge would serve it.

## The editor: edit → publish → re-render

The fixture-backed deployment is read-only, so promote it to a git repo before editing in the browser.

1. **`pnpm local git-init demo`.** Creates a real bare git repository under `state/git/demo.git`, seeds it with the fixture as a genuine commit, and installs a `post-receive` hook. From then on the deployment is served by real git and pushes fire webhooks.

2. **Open the editor.** It runs on the product-dashboard at `http://localhost:3300` (started as the `product-dashboard` service with `NEXT_PUBLIC_SELF_HOST_EDITOR=true`). Use `pnpm local dashboard` for the admin dashboard at `:9330` to find the deployment and jump into its editor.

3. **Edit and publish.** The editor sends file changes to gitfarm-sim's `commit` endpoint, which clones the branch, applies the changes, commits, and pushes. The `post-receive` hook curls the sim, which fires both the GitHub-style push webhook and the CRUX `new_commit` webhook. The update-worker re-renders, and refreshing `http://demo.localhost:4173` shows the change. This is a real git push, webhook, and render cycle rather than a mock, so it behaves like the production gitfarm/CRUX path.

## How the fake gitfarm works

gitfarm-sim (`:9326`) has two modes, and knowing which one you are in explains most surprises:

| Mode    | When                            | Backing                                                                   | Writable                        |
| ------- | ------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| Fixture | After `seed`, before `git-init` | In-memory snapshot of `fixtures/<sub>`, hashed for a synthetic SHA        | No (read-only)                  |
| Git     | After `git-init`                | Real bare repo at `state/git/<sub>.git`; all endpoints shell out to `git` | Yes (commits, branches, pushes) |

In git mode, `tree`/`blobs`/`ref`/`archive` map to `git ls-tree`/`cat-file`/`rev-parse`/`git archive`, clones and fetches proxy to `git http-backend`, and the editor's publish goes through a real clone, commit, and push. The only in-memory pieces left are derived caches (the fixture snapshot and generated archives), never the source of truth. Delete `state/` to reset everything.

## Command reference

| Command                     | What it does                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm local doctor`         | Preflight: layout, docker, node, env drift vs the server envalid schema                |
| `pnpm local up`             | Infra containers, server, and update-worker from source (`--no-build`, `--skip-infra`) |
| `pnpm local seed [sub]`     | Seed org/user/deployment pointed at gitfarm-sim (default `demo`)                       |
| `pnpm local trigger <sub>`  | Fire an update build (`-w`/`--watch` to follow live and capture a report)              |
| `pnpm local git-init <sub>` | Promote a fixture to a real git repo (enables editor publish)                          |
| `pnpm local open <sub>`     | Open the rendered static site via the edge-preview server                              |
| `pnpm local dashboard`      | Open the admin dashboard (`:9330`)                                                     |
| `pnpm local report`         | Open the latest run's report                                                           |
| `pnpm local status`         | Show service and container status                                                      |
| `pnpm local logs <service>` | Tail a service log (`-n <lines>`)                                                      |
| `pnpm local down`           | Stop services (`--infra` also stops containers)                                        |

## Ports

| Port                | Service                                     |
| ------------------- | ------------------------------------------- |
| 5000                | server                                      |
| 4173                | edge preview (`<sub>.localhost:4173`)       |
| 3300                | product-dashboard / editor                  |
| 9330                | admin dashboard                             |
| 9326                | gitfarm-sim                                 |
| 9000                | minio (S3)                                  |
| 4566                | ministack (LocalStack: SQS, CloudFront KVS) |
| 27017 / 6379 / 5432 | mongo / redis / postgres                    |

Services managed by the tool: `server`, `update-worker`, `gitfarm-sim`, `preview`, `hocuspocus`, `product-dashboard`, `admind`, `lambda-shim`.

## Troubleshooting

- **doctor reports env drift.** The server's `envalid` schema found missing or invalid vars for `selfhosted` mode. The report lists each one; the tool auto-fills generated secrets on `up`. If a var needs a real value, add it and re-run `pnpm local doctor`.
- **A service is not healthy after 180s.** Tail its log: `pnpm local logs <service>`. Most first-run failures are infra not fully up, so re-run `pnpm local up` (idempotent) or check `pnpm local status`.
- **Editor loads but Publish does nothing.** Make sure `pnpm local git-init <sub>` ran. The fixture-backed deployment is read-only, so publish has nowhere to push until a real repo exists.
- **server repo not found.** The tool resolves `server` as a sibling of `mint`. If yours lives elsewhere, `export SELFHOST_SERVER_DIR=/abs/path/to/server` and re-run.
- **Start over from scratch.** `pnpm local down --infra` stops everything, then delete `state/` to wipe the generated env, git repos, and captured runs.
- **Port 5000 already taken.** A stale `node ./lib/entryPoints/server.js` from a non-container server run will collide. Check `lsof -iTCP:5000 -sTCP:LISTEN`, kill the pid, retry.
