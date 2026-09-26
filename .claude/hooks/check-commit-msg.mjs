#!/usr/bin/env node
// PreToolUse(Bash): git commit 메시지 첫 줄이 O2 팀 규칙(`type: subject`)인지 검사한다.
// 틀리면 exit 2 → 커밋이 실행되지 않고 사유가 Claude에게 전달된다. (CI에서 막히기 전에 미리 막기)
const input = JSON.parse(
  await new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c)).on("end", () => r(d || "{}"));
  }),
);
const cmd = input.tool_input?.command ?? "";
if (!/\bgit\s+commit\b/.test(cmd)) process.exit(0);
if (/--no-edit|\s-F\s|--file[=\s]/.test(cmd)) process.exit(0); // 메시지를 새로 쓰지 않는 경우

/** -m 뒤 메시지의 첫 줄을 꺼낸다 (따옴표 · heredoc 둘 다) */
const firstLine = () => {
  const heredoc = cmd.match(/<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1/);
  if (heredoc) return heredoc[2].split("\n").find((l) => l.trim())?.trim();
  const quoted = cmd.match(/(?:-m|--message)[=\s]+(["'])([\s\S]*?)\1/);
  if (quoted) return quoted[2].split("\n")[0].trim();
  return null;
};

const line = firstLine();
if (line == null) process.exit(0);

const TYPES = ["feat", "fix", "docs", "style", "refactor", "chore", "perf", "ci", "revert", "merge", "hotfix"];
const m = line.match(/^([a-z]+): (.+)$/);
const fail = (why) => {
  process.stderr.write(
    `[commit-msg] "${line}" — ${why}\n형식: type: subject (type = ${TYPES.join(" | ")}, subject 50자 이내·개조식·쉼표 없음·마침표로 끝내지 않음). commit-pr 스킬 참고.\n`,
  );
  process.exit(2);
};

if (!m) fail("`type: subject` 형식이 아닙니다");
const [, type, subject] = m;
if (!TYPES.includes(type)) fail(`허용되지 않은 type "${type}"`);
if ([...subject].length > 50) fail(`subject가 ${[...subject].length}자입니다`);
if (subject.includes(",")) fail("쉼표를 쓰지 않습니다");
if (/\.$/.test(subject)) fail("마침표로 끝내지 않습니다");
if (/(했습니다|합니다|했다|한다)$/.test(subject)) fail("문장식이 아니라 개조식으로 씁니다 (예: ~구현, ~수정)");
process.exit(0);
