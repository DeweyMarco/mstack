# MCP Server (for the discoverability check)

The `mcp-server-discoverable` and `mcp-tool-count` checks want a JSON-RPC MCP server reachable at a discoverable URL (typically `/mcp`) that responds to:

1. `initialize` — returns server info
2. `tools/list` — returns at least one tool

This is the **Streamable HTTP** transport (the modern way). For a public read-only catalog server, **stateless mode** is simplest and correct.

## What the check actually does

Roughly:
1. POSTs `{"jsonrpc":"2.0","method":"initialize","params":{...}}` to `/mcp` with `Accept: application/json, text/event-stream`
2. Expects either JSON or an SSE stream containing `result.serverInfo.name`
3. POSTs `tools/list` and expects a non-empty `result.tools` array

That's it. Get those two methods working and the check passes.

## Pick your stack

The MCP protocol is implemented in [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (Node/TypeScript), with ports for Python, Go, Rust. Pick whichever fits your runtime. Two common choices in JavaScript-land:

- **`@modelcontextprotocol/sdk` directly** — full control, route handler at exactly `/mcp`. Recommended below for full apps that own their routing.
- **[`mcp-handler`](https://www.npmjs.com/package/mcp-handler)** — Vercel's higher-level adapter. Saves boilerplate but uses a `[transport]` dynamic segment, so the default endpoint is `/api/mcp` not `/mcp`. Configurable via `basePath`.

Other runtimes have similar packages — e.g., the Python SDK includes a Streamable HTTP transport too. The protocol is the same regardless.

## Minimal Streamable HTTP server (stateless)

Pseudocode-level outline (works in any HTTP framework — Next.js route handler, Express, Hono, Fastify, Cloudflare Workers, Bun, etc.):

```
on POST /mcp:
  body = parse JSON-RPC from request
  switch body.method:
    case "initialize":
      respond { jsonrpc: "2.0", id: body.id, result: { serverInfo: { name, version }, protocolVersion: "2025-06-18", capabilities: { tools: {} } } }
    case "tools/list":
      respond { jsonrpc: "2.0", id: body.id, result: { tools: [ {name, description, inputSchema}, ... ] } }
    case "tools/call":
      // dispatch to your tool handlers
      ...
```

The SDK does this for you correctly (including the SSE handshake). Don't roll your own JSON-RPC parser — the SDK handles edge cases.

## Concrete implementation: Next.js App Router

This is one example for a stack the user might be on. Adapt to your runtime if different.

**Install:**
```bash
pnpm add @modelcontextprotocol/sdk zod
```

**`app/mcp/route.ts`:**
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

export const runtime = "nodejs";        // Edge runtime not supported
export const dynamic = "force-dynamic"; // don't cache

const buildServer = () => {
  const server = new McpServer(
    { name: "your-site", version: "1.0.0" },
    { instructions: "Brief description of what this server does." }
  );

  // Register at least one tool. Pick whatever's useful for your domain.
  server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "Fuzzy-search items by name or keyword.",
      inputSchema: {
        query: z.string().min(1).describe("Search term"),
        limit: z.number().int().min(1).max(50).optional().default(10),
      },
    },
    ({ query, limit }) => {
      // your search logic
      const matches = []; // [{name, url, ...}]
      return {
        content: [{ type: "text", text: JSON.stringify({ query, results: matches }, null, 2) }],
      };
    }
  );

  return server;
};

const handler = async (req: Request) => {
  const transport = new WebStandardStreamableHTTPServerTransport({});
  const server = buildServer();
  await server.connect(transport);
  const response = await transport.handleRequest(req);
  req.signal.addEventListener("abort", () => {
    transport.close().catch(() => {});
  });
  return response;
};

export { handler as GET, handler as POST, handler as DELETE };
```

For other runtimes, the same idea: instantiate a server, register tools, hook the transport to your HTTP framework.

## Tool design — what to expose

For a catalog/library/docs site, three tools cover most use cases:

- `search_<thing>(query, limit)` — fuzzy search
- `list_<thing>(limit, offset)` — paginated browsing
- `get_<thing>(name)` — full details for one item

Tools that return JSON in their `text` content (rather than free-form prose) are the most useful — agents can parse them reliably.

If your domain doesn't fit a catalog (e.g., it's an analytics site, a calendar, a chat app) pick whatever tools an agent would actually use. The check only requires ≥ 1 tool, but adding genuinely useful ones makes the server worth integrating with.

## Don't break things adjacent to /mcp

- **Don't list `/mcp` as a markdown link in `llms.txt`.** A plain `GET /mcp` returns **406 Not Acceptable** (the protocol requires specific `Accept` headers). Link checkers will flag it as broken. Reference it in prose with backticks: `` An MCP server is available at `https://site.com/mcp`. ``
- **If you have a markdown content-negotiation middleware**, exempt `/mcp` from rewrites — otherwise an `Accept: text/markdown` request to your origin gets misrouted.
- **`robots.txt` should allow `/mcp`** — most agents discover it via robots, and disallowing it can cause the check to skip.

## Verify locally

```bash
# Initialize
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}'

# List tools
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Call a tool (replace tool name + args)
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_items","arguments":{"query":"foo","limit":3}}}'
```

You should see SSE responses like `event: message\ndata: {"result":{...},"jsonrpc":"2.0","id":1}`. If you get 406, the `Accept` header is wrong. If you get 404, your route isn't mounted.

## Configure clients

After deploy, users connect via:

```json
// ~/.cursor/mcp.json or .cursor/mcp.json in a project
{
  "mcpServers": {
    "your-site": {
      "url": "https://site.com/mcp"
    }
  }
}
```

For older clients without Streamable HTTP support, use [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) as a stdio→HTTP bridge:

```json
{
  "mcpServers": {
    "your-site": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://site.com/mcp"]
    }
  }
}
```
