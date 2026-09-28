#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit): 건드리면 안 되는 경로와 FSD 밖 폴더 생성을 기계적으로 막는다.
// exit 2 + stderr → 도구 실행이 차단되고 사유가 Claude에게 전달된다.
import { relative, sep } from "node:path";

const input = JSON.parse(
  await new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c)).on("end", () => r(d || "{}"));
  }),
);
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const file = input.tool_input?.file_path;
if (!file) process.exit(0);
const rel = relative(root, file).split(sep).join("/");

const block = (why) => {
  process.stderr.write(`[guard] ${rel}: ${why}\n`);
  process.exit(2);
};

if (rel.startsWith("..")) process.exit(0); // 저장소 밖(스크래치 등)은 관여하지 않음
if (rel.startsWith("docs/design/reference/"))
  block("디자인 원본은 읽기 전용입니다. 바뀐 디자인은 Claude Design에서 다시 내보내 사람이 교체합니다.");
if (/(^|\/)\.env(\.|$)/.test(rel)) block(".env 파일은 수정하지 않습니다.");
if (rel === "pnpm-lock.yaml") block("lockfile은 pnpm 명령으로만 바뀝니다.");
if (rel === "pages/README.md" || rel.startsWith("pages/"))
  block("루트 pages/는 Pages Router 충돌 방지용 스텁입니다. 라우팅은 루트 app/에서만 합니다.");

const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
if (rel.startsWith("src/")) {
  const layer = rel.split("/")[1];
  if (!LAYERS.includes(layer))
    block(
      `src/ 바로 아래에는 FSD 레이어(${LAYERS.join(", ")})만 둡니다. components/, hooks/, lib/ 같은 폴더를 만들지 마세요.`,
    );
}
if (
  rel.startsWith("app/") &&
  /\.(tsx?|jsx?)$/.test(rel) &&
  !/\/(layout|page|loading|error|not-found|template|route|default|opengraph-image|icon)\.(tsx?|jsx?)$/.test(
    `/${rel}`,
  )
)
  block("루트 app/은 Next 라우팅 파일만 둡니다. 화면 코드는 src/pages 또는 src/widgets에 작성하세요.");

process.exit(0);
