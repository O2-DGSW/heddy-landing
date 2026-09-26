#!/usr/bin/env node
// Stop: 코드가 바뀐 턴이면 typecheck → test → fsd(steiger)를 돌리고, 실패하면 exit 2로 멈추지 못하게 한다.
// (stderr가 Claude에게 전달되어 이어서 고치게 됨)
import { spawnSync } from "node:child_process";

const input = JSON.parse(
  await new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c)).on("end", () => r(d || "{}"));
  }),
);
if (input.stop_hook_active) process.exit(0); // 이미 한 번 막았으면 무한 루프 방지

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: "utf8" });

const changed = run("git", ["status", "--porcelain", "--", "src", "app"]).stdout.trim();
if (!changed) process.exit(0); // 대화만 한 턴은 검사하지 않음

for (const script of ["typecheck", "test", "fsd"]) {
  const r = run("pnpm", ["-s", script]);
  if (r.status !== 0) {
    const out = (r.stdout + r.stderr).trim().split("\n").slice(-40).join("\n");
    process.stderr.write(`[verify] pnpm ${script} 실패 — 고친 뒤 끝내세요.\n${out}\n`);
    process.exit(2);
  }
}
process.exit(0);
