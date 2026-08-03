---
name: salesforce-migration
description: |
  How Solutions Engineers create, update, and report on Migration (Migration__c)
  records in Salesforce — the field model, automation, and sf CLI workflow. Use
  when tracking customer migrations onto Mintlify in Salesforce, creating or
  updating Migration__c records, setting status/health/SOW links, or building
  migration reports.
---

# Tracking migrations in Salesforce

The full, always-current documentation for this skill lives on the internal KB page:
**https://kb.mintlify.com/sales/migration/migration-tracking**

This skill file intentionally contains no copy of that content — fetch the live page and treat it as the sole source of truth for the `Migration__c` field model, automation (flows, validation rules), and `sf` CLI workflow.

## How to fetch the page

`kb.mintlify.com` is auth-gated — a plain `WebFetch`/`curl` gets redirected to `/login` and returns an empty app shell, so do NOT fetch the URL directly. The `mintlify-knowledge` MCP server only covers the public mintlify.com docs, not the KB. Instead, pull the live page through the **Mintlify Admin MCP**:

1. If the tools are deferred, load them in one call:
   `ToolSearch` with query `select:mcp__claude_ai_Mintlify__checkout,mcp__claude_ai_Mintlify__read,mcp__claude_ai_Mintlify__discard_session`
2. `mcp__claude_ai_Mintlify__checkout` with `subdomain: "kb"` (required before `read`; takes ~7s)
3. `mcp__claude_ai_Mintlify__read` with `path: "/sales/migration/migration-tracking"`
4. When finished reading, `mcp__claude_ai_Mintlify__discard_session` — you made no edits, so nothing is published and the throwaway branch is deleted.

Related KB pages (e.g. `/sales/revops/objects` for the full custom-object schema) can be read in the same session with additional `read` calls before discarding.

If the Mintlify Admin MCP is unavailable in the session, say so and ask the user to connect it (or paste the page) — do not answer Migration__c field/automation questions from memory, since the object's fields and picklists change over time.
