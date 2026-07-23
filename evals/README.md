# mstack evals

These evals check whether a generated Mintlify preview followed the mstack contract used by `sophiabarness/preview-automation`.

`preview-automation` runs mstack like this:

1. A Slack mention supplies `<company>` and `<docs_url>`.
2. The app creates or reuses a private GitHub repo named `<company>-preview`.
3. A Cursor cloud agent clones the preview repo, clones mstack into `./mstack/`, reads the mstack README and skills, then runs the full workflow.
4. The agent must add `mstack/` to both `.gitignore` and `.mintignore` and must not commit the helper checkout.
5. The app provisions `https://<company>-preview.mintlify.app`.
6. The agent opens PRs, merges to `main`, and exits only after mstack's quality gates pass.

The eval runner validates the parts of that contract that can be checked from a preview repo without live Slack, Cursor, or Mintlify deployment credentials.

## Quick start

```bash
node evals/run-preview-eval.mjs \
  --preview-repo /path/to/company-preview \
  --source-url https://docs.example.com \
  --company company
```

By default the runner writes:

- `evals/runs/<company-or-repo>/report.json`
- `evals/runs/<company-or-repo>/report.md`

`evals/runs/` is intentionally gitignored.

## What It Checks

- Preview repo exists and has a valid `docs.json`.
- `mstack/` is ignored in `.gitignore` and `.mintignore`.
- `mstack/` is not committed to the preview repo.
- `docs.json` navigation references existing `.mdx` files.
- Managed `.mdx` files are reachable from navigation, allowing `index.mdx` as the site root.
- Default Mintlify template leftovers are not present in `docs.json`.
- Optional local commands run when available: `mint validate`, `mint broken-links`, and `npx afdocs check`.

## Options

```text
--preview-repo <path>       Required. Local checkout of the generated preview repo.
--source-url <url>          Source docs URL from the Slack request.
--company <slug>            Company slug used for report naming.
--preview-url <url>         Preview URL, usually https://<company>-preview.mintlify.app.
--out <path>                Output directory. Defaults to evals/runs/<company-or-repo>.
--skip-mint                 Skip mint/afdocs command checks.
--fail-on-warn              Exit non-zero when warnings are present.
```

## Running With preview-automation

Use preview-automation to create the preview, then clone the generated repo locally:

```bash
gh repo clone mintlify-onboarding/acme-preview /tmp/acme-preview
node evals/run-preview-eval.mjs \
  --preview-repo /tmp/acme-preview \
  --source-url https://docs.acme.com \
  --company acme \
  --preview-url https://acme-preview.mintlify.app
```

Run this after the Cursor agent has merged its migration PRs into `main`. If the eval fails, fix the preview repo with the relevant mstack skill, then rerun from the beginning.
