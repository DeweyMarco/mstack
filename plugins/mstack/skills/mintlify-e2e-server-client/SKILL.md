---
name: mintlify-e2e-server-client
description: Full local e2e testing flow for Mintlify docs changes spanning server, client, and dashboard. Use when the user wants to e2e test mint client changes against real processed deployment data, test server-side data processing (docs.json validation, update workflows), run the dashboard locally (yarn dev in mint/apps/dashboard, tmux window mintlify:1), or verify a change end-to-end across server + client. Keywords: e2e, server, client, dashboard, deployment update, tmux, customerPages, API_ENDPOINT.
---

# Mintlify server + client local e2e testing

## Repos and paths

- Server: `/Users/marcodewey/mintlify/server`
- Client: `/Users/marcodewey/mintlify/mint/apps/client`
- Test docs content repo: `<TODO: path to your test docs clone>` (test subdomain `<TODO: your test subdomain>`, git push to `github.com:<you>/docs.git` main)

Throughout this doc, `<sub>` means that test subdomain.

Related: the `mintlify-selfhost-local` skill covers the full containerized self-host pipeline. Use this skill instead when you want the local server talking to the shared dev Mongo, with no containers.

## tmux layout (session `mintlify`)

- Window 0: client, `yarn dev` in mint/apps/client (serves localhost:3000)
- Window 1 (named `dashboard`): `yarn dev` in mint/apps/dashboard (serves localhost:3000; env via infisical `--env=dev`, so it talks to the shared dev API/Stytch and needs no local server)
- Window 2 (named `server`): `pnpm dev:skip-redis` in server/ (serves localhost:5000; boots API + SQS update worker; takes ~45s)
- Client and dashboard BOTH default to port 3000, so run one at a time or the second silently takes 3001.
- Drive: `tmux send-keys -t mintlify:0 '<cmd>' Enter` / `-t mintlify:2`
- Inspect: `tmux capture-pane -t mintlify:2 -p | tail`
- If the session does not exist yet: `tmux new-session -d -s mintlify` plus the named windows before any `send-keys`.

## Flow

1. **Start server**

   ```sh
   tmux send-keys -t mintlify:2 'cd /Users/marcodewey/mintlify/server && pnpm dev:skip-redis' Enter
   ```

   Health check: `curl http://localhost:5000/api/health` returns 200.

   Gotcha: a stale `node ./lib/entryPoints/server.js` process often already holds port 5000, so the stack dies with EADDRINUSE. Check `lsof -iTCP:5000 -sTCP:LISTEN` (Linux: `ss -tlnp | grep :5000`), kill the pid, restart.

2. **Edit content** in the test docs repo (docs.json, mdx pages), then commit AND push. The update workflow pulls from GitHub, so uncommitted or unpushed changes are invisible to it.

3. **Trigger processing**

   ```sh
   INTERNAL_TOKEN=$(cd /Users/marcodewey/mintlify/server && infisical run --env=local -- printenv INTERNAL_TOKEN 2>/dev/null | tail -1)
   curl -X POST http://localhost:5000/api/internal/deployment/update/<sub> \
     -H "Authorization: Bearer $INTERNAL_TOKEN"
   ```

   Success = 202 with `{"deploymentHistoryId": "..."}`. Route defined in `api/routes/internal/deploymentInternal.router.ts`, mounted at `/api/internal/deployment`.

4. **Wait for the SQS update worker** in window 2 to process. Watch `tmux capture-pane -t mintlify:2 -p` for update-workflow logs.

5. **Start client, pointed at the local server**

   ```sh
   tmux send-keys -t mintlify:0 'cd /Users/marcodewey/mintlify/mint/apps/client && API_ENDPOINT=http://localhost:5000 API_ENDPOINT_INTERNAL=http://localhost:5000 yarn dev' Enter
   ```

   The `API_ENDPOINT` overrides are REQUIRED. The client's infisical dev env points at `https://leaves-dev.mintlify.com`, so a plain `yarn dev` fetches page data from the hosted dev service and ignores your locally processed update. Resolution logic: `mint/packages/http-client/src/leaves-client/constants.ts`.

   Request pages at `http://<sub>.localhost:3000/<page>` (curl works; subdomain routing goes through the Host header).

6. **Check port 3000 is free first.** If occupied, Next silently uses 3001 and the subdomain URL will not hit your build.

## Gotchas

- The server validates docs.json with its published `@mintlify/validation` from npm, NOT the local mint repo. New docs.json schema fields added in `mint/packages/validation` get STRIPPED by zod until that package is published and the server bumps it. Local workaround: build validation in mint (`yarn build --filter=@mintlify/validation`), then copy the changed compiled files from `mint/packages/validation/dist/...` over the server's copy. Resolve the target with `node -e "console.log(require.resolve('@mintlify/validation/package.json'))"` inside `server/` (it lands in `node_modules/.pnpm/...`), copy, restart the server stack.
- Only the `_sites` multitenant route in the client renders full production behavior (JSON-LD, shouldIndex-gated features, and so on). The plain local prebuild route does not.
- Server env comes from infisical (`infisical run --env=local -- ...`).
- The update workflow ALWAYS fails its `revalidatePages` step locally, because it POSTs to `http://<sub>.mintlify.site/_mintlify/revalidate` and gets a 404. This is benign: the content and config steps run earlier, so the data is stored despite the "Workflow failed" line.
- If the test deployment has end-user auth set (`auth: {type: 'mintlify'}` on the deployment doc), the unauthenticated `/api/client/page/...` route 404s via `assertUnauthenticatedDeploymentMiddleware` and every page renders 404. Temporarily unset it and RESTORE it afterward:

  ```sh
  MURI=$(cd /Users/marcodewey/mintlify/server && infisical run --env=local -- printenv MONGO_URI 2>/dev/null | tail -1)
  mongosh "$MURI" --quiet --eval "db.deployments.updateOne({subdomain:'<sub>'},{\$unset:{auth:''}})"
  # ... test ...
  mongosh "$MURI" --quiet --eval "db.deployments.updateOne({subdomain:'<sub>'},{\$set:{auth:{type:'mintlify'}}})"
  ```

- Data lands in the shared dev Mongo, database `dev`: deployment config in `deployments`, page content in `customerPages` (capital P). Useful for checking whether an update actually stored what you expect before blaming the client.
