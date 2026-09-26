#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): 방금 바꾼 파일만 prettier + eslint --fix.
// 자동으로 못 고친 eslint 에러가 남으면 exit 2 → stderr가 Claude에게 피드백으로 간다.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, sep } from "node:path";

const input = JSON.parse(
  await new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c)).on("end", () => r(d || "{}"));
  }),
);
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const file = input.tool_input?.file_path;
if (!file || !existsSync(file)) process.exit(0);
const rel = relative(root, file).split(sep).join("/");
if (rel.startsWith("..") || rel.startsWith("docs/design/reference/")) process.exit(0);

const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: "utf8" });

if (/\.(tsx?|jsx?|mjs|css|json|md)$/.test(rel))
  run("pnpm", ["exec", "prettier", "--write", "--log-level=warn", rel]);

if (/\.(tsx?|jsx?|mjs)$/.test(rel)) {
  const r = run("pnpm", ["exec", "eslint", "--fix", rel]);
  if (r.status !== 0) {
    process.stderr.write(`[eslint] ${rel}\n${(r.stdout + r.stderr).trim().slice(0, 3000)}\n`);
    process.exit(2);
  }
}
process.exit(0);
