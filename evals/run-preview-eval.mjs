#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(new URL("..", import.meta.url).pathname);

function parseArgs(argv) {
  const args = {
    skipMint: false,
    failOnWarn: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skip-mint") {
      args.skipMint = true;
    } else if (arg === "--fail-on-warn") {
      args.failOnWarn = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[key] = value;
      i += 1;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!args.previewRepo) {
    throw new Error("Missing required --preview-repo <path>");
  }

  args.previewRepo = resolve(args.previewRepo);
  const runName = args.company || basename(args.previewRepo);
  args.out = resolve(args.out || join(ROOT, "evals", "runs", runName));
  return args;
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  return {
    command: [command, ...commandArgs].join(" "),
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    ok: result.status === 0,
    missing: result.error?.code === "ENOENT",
  };
}

function listFiles(cwd) {
  const result = run("git", ["ls-files"], cwd);
  if (result.ok) {
    return result.stdout.split("\n").filter(Boolean);
  }
  const fallback = run("find", [".", "-type", "f"], cwd);
  if (!fallback.ok) return [];
  return fallback.stdout
    .split("\n")
    .filter(Boolean)
    .map((file) => file.replace(/^\.\//, ""));
}

function addCheck(checks, name, status, notes = "") {
  checks.push({ name, status, notes });
}

function normalizeSlug(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\//, "")
    .replace(/\.mdx?$/, "")
    .replace(/\/index$/, "/index");
}

function collectNavRefs(value, refs = new Set()) {
  if (typeof value === "string") {
    refs.add(normalizeSlug(value));
    return refs;
  }
  if (!value || typeof value !== "object") return refs;

  if (typeof value.page === "string") refs.add(normalizeSlug(value.page));
  if (typeof value.path === "string") refs.add(normalizeSlug(value.path));

  for (const key of [
    "pages",
    "groups",
    "anchors",
    "tabs",
    "dropdowns",
    "navigation",
    "global",
  ]) {
    const child = value[key];
    if (Array.isArray(child)) {
      for (const item of child) collectNavRefs(item, refs);
    } else if (child && typeof child === "object") {
      collectNavRefs(child, refs);
    }
  }

  return refs;
}

function navRefExists(ref, mdxFiles) {
  const candidates = [
    `${ref}.mdx`,
    `${ref}.md`,
    `${ref}/index.mdx`,
    `${ref}/index.md`,
  ];
  return candidates.some((candidate) => mdxFiles.has(candidate));
}

function commandSummary(result) {
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (result.missing) return "command not found";
  if (!output) return result.ok ? "passed" : `exited ${result.status}`;
  return output.split("\n").slice(-6).join("\n");
}

function renderMarkdown(report) {
  const rows = report.checks
    .map((check) => {
      const notes = String(check.notes || "").replace(/\n/g, "<br>");
      return `| ${check.name} | ${check.status} | ${notes} |`;
    })
    .join("\n");

  return `# mstack preview eval

**Status:** ${report.status}
**Preview repo:** ${report.previewRepo}
**Source URL:** ${report.sourceUrl || "not provided"}
**Preview URL:** ${report.previewUrl || "not provided"}
**Generated:** ${report.generatedAt}

| Check | Status | Notes |
|---|---:|---|
${rows}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = [];

  if (!existsSync(args.previewRepo)) {
    addCheck(checks, "preview repo exists", "FAIL", args.previewRepo);
    return finish(args, checks);
  }
  addCheck(checks, "preview repo exists", "PASS", args.previewRepo);

  const files = listFiles(args.previewRepo);
  const docsJsonPath = join(args.previewRepo, "docs.json");
  let docsJson = null;

  try {
    docsJson = JSON.parse(readFileSync(docsJsonPath, "utf8"));
    addCheck(checks, "docs.json parses", "PASS");
  } catch (err) {
    addCheck(checks, "docs.json parses", "FAIL", err.message);
  }

  for (const ignoreFile of [".gitignore", ".mintignore"]) {
    const text = readText(join(args.previewRepo, ignoreFile));
    const hasMstack = text.split(/\r?\n/).some((line) => line.trim() === "mstack/");
    addCheck(
      checks,
      `${ignoreFile} ignores mstack`,
      hasMstack ? "PASS" : "FAIL",
      hasMstack ? "mstack/" : "missing mstack/"
    );
  }

  const committedMstackFiles = files.filter((file) => file === "mstack" || file.startsWith("mstack/"));
  addCheck(
    checks,
    "mstack helper not committed",
    committedMstackFiles.length === 0 ? "PASS" : "FAIL",
    committedMstackFiles.slice(0, 10).join(", ")
  );

  const mdxFiles = new Set(files.filter((file) => [".md", ".mdx"].includes(extname(file))));
  if (docsJson) {
    const navRefs = collectNavRefs(docsJson);
    const missingRefs = [...navRefs].filter((ref) => !navRefExists(ref, mdxFiles));
    addCheck(
      checks,
      "navigation refs resolve",
      missingRefs.length === 0 ? "PASS" : "FAIL",
      missingRefs.slice(0, 20).join(", ")
    );

    const reachable = new Set();
    for (const ref of navRefs) {
      for (const candidate of [`${ref}.mdx`, `${ref}.md`, `${ref}/index.mdx`, `${ref}/index.md`]) {
        if (mdxFiles.has(candidate)) reachable.add(candidate);
      }
    }

    const orphans = [...mdxFiles].filter((file) => file !== "index.mdx" && !reachable.has(file));
    addCheck(
      checks,
      "managed mdx files reachable",
      orphans.length === 0 ? "PASS" : "WARN",
      orphans.slice(0, 20).join(", ")
    );

    const docsJsonText = JSON.stringify(docsJson);
    const templateLeftovers = ["Blog", "Get started", "twitter", "x-twitter"].filter((needle) =>
      docsJsonText.includes(needle)
    );
    addCheck(
      checks,
      "no obvious template leftovers",
      templateLeftovers.length === 0 ? "PASS" : "WARN",
      templateLeftovers.join(", ")
    );
  }

  if (!args.skipMint) {
    for (const commandArgs of [
      ["mint", ["validate"]],
      ["mint", ["broken-links"]],
      ["npx", ["afdocs", "check"]],
    ]) {
      const [command, subArgs] = commandArgs;
      const result = run(command, subArgs, args.previewRepo);
      const status = result.ok ? "PASS" : result.missing ? "WARN" : "FAIL";
      addCheck(checks, result.command, status, commandSummary(result));
    }
  } else {
    addCheck(checks, "mint command checks", "WARN", "skipped by --skip-mint");
  }

  return finish(args, checks);
}

function finish(args, checks) {
  const hasFail = checks.some((check) => check.status === "FAIL");
  const hasWarn = checks.some((check) => check.status === "WARN");
  const status = hasFail || (args.failOnWarn && hasWarn) ? "FAIL" : hasWarn ? "WARN" : "PASS";
  const report = {
    status,
    generatedAt: new Date().toISOString(),
    previewRepo: args.previewRepo,
    sourceUrl: args.sourceUrl || null,
    previewUrl: args.previewUrl || null,
    checks,
  };

  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(args.out, "report.md"), renderMarkdown(report));

  console.log(`mstack preview eval: ${status}`);
  console.log(`Report: ${relative(process.cwd(), join(args.out, "report.md"))}`);

  process.exitCode = status === "FAIL" ? 1 : 0;
}

main();
