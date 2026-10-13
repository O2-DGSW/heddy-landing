import { describe, expect, it } from "vitest";

import { AR_PANEL, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeArScene } from "./arScene";

const W = 1440;
const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(W, H);
const ar = sections.find((section) => section.key === "ar");
if (!ar) throw new Error("section not found");

const atP = (p: number, isReducedMotion = false, frameLayout = layout): SceneFrame =>
  createFrame(ar.top + p * (ar.height - frameLayout.viewportHeight), frameLayout, sections, isReducedMotion);

const { pillMorphA, pillMorphB, pillMorphC, panelCopyIn, panelCopyOut, copyIn } = TIMELINE.ar;

describe("computeArScene: pill → 다크 패널", () => {
  it("시작은 작은 세로 pill(교차축 26 · 주축 58)이고, 처음에 나타난다", () => {
    const { pill } = computeArScene(atP(0));
    expect(pill.width).toBeCloseTo(AR_PANEL.pillStart.cross);
    expect(pill.height).toBeCloseTo(AR_PANEL.pillStart.main);
    expect(pill.opacity).toBe(0);
    expect(computeArScene(atP(TIMELINE.ar.pillFadeIn[1])).pill.opacity).toBe(1);
  });

  it("a 끝에 58 × 236, 모서리는 둥근 pill(반지름 = 짧은 변 / 2)", () => {
    const { pill } = computeArScene(atP(pillMorphA[1]));
    expect(pill.width).toBeCloseTo(AR_PANEL.pillA.cross);
    expect(pill.height).toBeCloseTo(AR_PANEL.pillA.main);
    expect(pill.radius).toBeCloseTo(AR_PANEL.pillA.cross / 2);
  });

  it("b 끝에 데스크톱 0.5W × 0.72H", () => {
    const { pill } = computeArScene(atP(pillMorphB[1]));
    expect(pill.width).toBeCloseTo(0.5 * W);
    expect(pill.height).toBeCloseTo(0.72 * H);
  });

  it("c 끝에 화면 전체(W × H)를 각진 모서리로 덮는다", () => {
    const { pill, panel } = computeArScene(atP(pillMorphC[1]));
    expect(pill.width).toBeCloseTo(W);
    expect(pill.height).toBeCloseTo(H);
    expect(pill.radius).toBeCloseTo(0);
    expect(panel).toBe(1);
  });

  it("분할 문구는 pill 가장자리에서 gap 20만큼 바깥에 있다(커지면 밀려난다)", () => {
    for (const p of [0.05, pillMorphA[1], 0.15]) {
      const { pill, splitOffset } = computeArScene(atP(p));
      expect(splitOffset).toBeCloseTo(pill.width / 2 + AR_PANEL.splitGap);
    }
  });

  it("모바일은 가로 pill: 주축이 폭, 문구는 위아래로 밀린다", () => {
    const mobile = computeStageLayout(390, 844);
    const { pill, splitOffset, isVertical } = computeArScene(atP(pillMorphA[1], false, mobile));
    expect(isVertical).toBe(false);
    expect(pill.width).toBeCloseTo(AR_PANEL.pillA.main);
    expect(pill.height).toBeCloseTo(AR_PANEL.pillA.cross);
    expect(splitOffset).toBeCloseTo(pill.height / 2 + AR_PANEL.splitGap);
  });
});

describe("computeArScene: 문구", () => {
  it("패널 문구는 in에서 아래로부터 올라오며 나타나고 out에서 사라진다", () => {
    expect(computeArScene(atP(panelCopyIn[0])).panelCopy.opacity).toBe(0);
    const shown = computeArScene(atP(panelCopyIn[1])).panelCopy;
    expect(shown.opacity).toBe(1);
    expect(shown.y).toBeCloseTo(0);
    expect(computeArScene(atP(panelCopyIn[0] + 0.001)).panelCopy.y).toBeGreaterThan(0);
    expect(computeArScene(atP(panelCopyOut[1])).panelCopy.opacity).toBe(0);
  });

  it("카피는 패널 문구가 사라진 뒤 나타난다", () => {
    expect(copyIn[0]).toBeGreaterThanOrEqual(panelCopyOut[1]);
    expect(computeArScene(atP(copyIn[0])).copy.opacity).toBe(0);
    expect(computeArScene(atP(copyIn[1])).copy).toEqual({ opacity: 1, y: 0 });
  });

  it("reduced motion이면 최종 상태(패널이 덮고 카피만 보임)", () => {
    const scene = computeArScene(atP(0, true));
    expect(scene.panel).toBe(1);
    expect(scene.panelCopy.opacity).toBe(0);
    expect(scene.copy).toEqual({ opacity: 1, y: 0 });
  });
});
