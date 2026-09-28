#!/usr/bin/env node
// Stop: 코드가 바뀐 턴이면 pnpm verify(typecheck·lint·test·fsd)를 돌리고, 실패하면 exit 2로 멈추지 못하게 한다.
// (stderr가 Claude에게 전달되어 이어서 고치게 됨)
// package.json의 verify 스크립트를 그대로 호출한다 — 검사 목록을 여기 따로 하드코딩하면
// verify 스크립트가 바뀔 때(예: lint 추가) 이 훅만 구식 목록으로 남아 lint 실패를 놓칠 수 있다.
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

const r = run("pnpm", ["-s", "verify"]);
if (r.status !== 0) {
  const out = (r.stdout + r.stderr).trim().split("\n").slice(-40).join("\n");
  process.stderr.write(`[verify] pnpm verify 실패 — 고친 뒤 끝내세요.\n${out}\n`);
  process.exit(2);
}
process.exit(0);
