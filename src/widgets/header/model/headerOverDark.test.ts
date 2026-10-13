import { describe, expect, it } from "vitest";

import { TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections } from "@/shared/lib/scroll";

import { isHeaderOverDarkPanel } from "./headerOverDark";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const ar = sections.find((section) => section.key === "ar");
if (!ar) throw new Error("section not found");
const atP = (p: number) => createFrame(ar.top + p * (ar.height - H), layout, sections, false);

describe("isHeaderOverDarkPanel", () => {
  it("pill이 화면을 다 덮기 전에는 아니다", () => {
    expect(isHeaderOverDarkPanel(atP(0))).toBe(false);
    expect(isHeaderOverDarkPanel(atP(TIMELINE.ar.pillMorphC[0]))).toBe(false);
  });

  it("다크 패널이 화면을 덮은 뒤 AR 섹션 끝까지 맞다", () => {
    expect(isHeaderOverDarkPanel(atP(TIMELINE.ar.pillMorphC[1]))).toBe(true);
    expect(isHeaderOverDarkPanel(atP(1))).toBe(true);
    // 고정이 끝나고 섹션이 위로 빠지는 동안에도 헤더 자리엔 아직 다크 패널이 있다
    expect(isHeaderOverDarkPanel(createFrame(ar.end - 10, layout, sections, false))).toBe(true);
  });

  it("AR 섹션이 다 지나가면(share) 아니다", () => {
    expect(isHeaderOverDarkPanel(createFrame(ar.end + 1, layout, sections, false))).toBe(false);
  });
});
