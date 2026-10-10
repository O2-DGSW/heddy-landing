import { describe, expect, it } from "vitest";

import { TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeTapToDetail } from "./tapToDetail";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const record = sections.find((section) => section.key === "record");
const report = sections.find((section) => section.key === "report");
if (!record || !report) throw new Error("section not found");

/** record end 기준 뷰포트 높이 배수 위치의 프레임 */
const atVh = (vh: number, isReducedMotion = false): SceneFrame =>
  createFrame(record.end + vh * H, layout, sections, isReducedMotion);

const { tapBand, pushBand } = TIMELINE.report;
const mid = ([a, b]: readonly [number, number]) => (a + b) / 2;

describe("computeTapToDetail", () => {
  it("탭 전에는 아무 일도 없다(기록 리스트 그대로)", () => {
    const tap = computeTapToDetail(atVh(tapBand[0] - 0.01));
    expect(tap).toEqual({ press: 0, ripple: 0, push: 0 });
  });

  it("탭 가운데서 카드가 가장 깊이 눌리고 물결이 퍼지는 중이다", () => {
    const tap = computeTapToDetail(atVh(mid(tapBand)));
    expect(tap.press).toBeCloseTo(1);
    expect(tap.ripple).toBeGreaterThan(0);
    expect(tap.ripple).toBeLessThan(1);
    expect(tap.push).toBe(0);
  });

  it("탭이 끝나면 카드가 돌아오고, 그다음 상세 화면이 밀려 들어온다", () => {
    const end = computeTapToDetail(atVh(tapBand[1]));
    expect(end.press).toBeCloseTo(0);
    expect(end.push).toBe(0);

    const pushing = computeTapToDetail(atVh(mid(pushBand)));
    expect(pushing.push).toBeCloseTo(0.5);
  });

  it("리포트 섹션이 화면에 붙을 때는 상세 화면이 다 들어와 있다", () => {
    const atReport = createFrame(report.top, layout, sections, false);
    expect(computeTapToDetail(atReport).push).toBe(1);
  });

  it("push는 단조 증가한다", () => {
    let prev = -1;
    for (let vh = pushBand[0]; vh <= pushBand[1]; vh += 0.01) {
      const { push } = computeTapToDetail(atVh(vh));
      expect(push).toBeGreaterThanOrEqual(prev);
      prev = push;
    }
  });

  it("reduced motion이면 누르는 연출 없이 바로 상세 화면이다", () => {
    expect(computeTapToDetail(atVh(mid(tapBand), true))).toEqual({ press: 0, ripple: 0, push: 1 });
  });
});
