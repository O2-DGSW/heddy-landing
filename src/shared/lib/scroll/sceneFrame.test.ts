import { describe, expect, it } from "vitest";

import { createFrame } from "./sceneFrame";
import { computeStageLayout, stackSections } from "./stageLayout";

const H = 900;
const layout = computeStageLayout(1440, H);
const sections = stackSections({}, H);
const record = sections.find((section) => section.key === "record");
if (!record) throw new Error("record missing");

describe("createFrame — 본 결과 유지(이슈 #89)", () => {
  it("본 위치가 없으면 지금 위치 그대로 진행도를 계산한다", () => {
    const frame = createFrame(record.top + (record.height - H) / 2, layout, sections, false);
    expect(frame.progress("record")).toBeCloseTo(0.5);
    expect(frame.seenScrollY).toBe(frame.scrollY);
  });

  it("더 아래까지 본 적이 있으면 다시 올라와도 진행도는 본 결과(완성)를 유지한다", () => {
    const bottom = sections[sections.length - 1].top;
    const frame = createFrame(record.top + 10, layout, sections, false, bottom);
    expect(frame.progress("record")).toBe(1);
    expect(frame.scrollY).toBe(record.top + 10);
    expect(frame.seenScrollY).toBe(bottom);
  });

  it("처음 내려가는 중엔(본 위치가 지금보다 위) 영향이 없다", () => {
    const frame = createFrame(record.top + 100, layout, sections, false, record.top - 500);
    expect(frame.progress("record")).toBeCloseTo(100 / (record.height - H));
    expect(frame.seenScrollY).toBe(record.top + 100);
  });

  it("아직 화면 아래에 있는 섹션은 본 적이 있어도 처음 상태다(고정 폰 자세가 앞 섹션을 따르게)", () => {
    const share = sections.find((section) => section.key === "share");
    if (!share) throw new Error("share missing");
    const frame = createFrame(share.top - H - 10, layout, sections, false, sections[sections.length - 1].top);
    expect(frame.progress("share")).toBe(0);
    expect(frame.sceneY("share")).toBe(share.top - H - 10);
    expect(frame.sceneY("record")).toBe(sections[sections.length - 1].top);
  });
});
