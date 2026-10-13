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

const { pillMorph, panelCopyIn, panelCopyOut, copyIn } = TIMELINE.ar;

/** 확대 구간을 촘촘히 훑은 진행도 */
const morphSamples = Array.from({ length: 401 }, (_, i) => pillMorph[0] + (i / 400) * (pillMorph[1] - pillMorph[0]));

/** pill이 정해진 크기를 지나는 지점: 한 축이 그 값에 가장 가까울 때 다른 축 값 */
const sizeWhere = (frameAt: (p: number) => SceneFrame, axis: "width" | "height", value: number) => {
  const best = morphSamples
    .map((p) => computeArScene(frameAt(p)).pill)
    .reduce((a, b) => (Math.abs(b[axis] - value) < Math.abs(a[axis] - value) ? b : a));
  return best;
};

describe("computeArScene: pill → 다크 패널", () => {
  it("시작은 작은 세로 pill(교차축 26 · 주축 58)이고, 처음에 나타난다", () => {
    const { pill } = computeArScene(atP(0));
    expect(pill.width).toBeCloseTo(AR_PANEL.pillStart.cross);
    expect(pill.height).toBeCloseTo(AR_PANEL.pillStart.main);
    expect(pill.opacity).toBe(0);
    expect(computeArScene(atP(TIMELINE.ar.pillFadeIn[1])).pill.opacity).toBe(1);
  });

  it("빨리 커진다: 원본(ar 진행도 0.28)보다 한참 앞인 0.14에 화면 전체(W × H)를 각진 모서리로 덮는다", () => {
    expect(pillMorph[1]).toBeLessThanOrEqual(0.14);
    const { pill, panel } = computeArScene(atP(pillMorph[1]));
    expect(pill.width).toBeCloseTo(W);
    expect(pill.height).toBeCloseTo(H);
    expect(pill.radius).toBeCloseTo(0);
    expect(panel).toBe(1);
  });

  it("커지는 길에 원본 단계 크기를 지난다: 58 × 236(둥근 pill), 0.5W × 0.72H", () => {
    const a = sizeWhere(atP, "width", AR_PANEL.pillA.cross);
    expect(a.height).toBeCloseTo(AR_PANEL.pillA.main, -1);
    expect(a.radius).toBeCloseTo(a.width / 2, 0);
    const b = sizeWhere(atP, "width", 0.5 * W);
    expect(b.height / H).toBeCloseTo(0.72, 1);
  });

  it("커지면 타원이 아니라 둥근 사각형이다: 모서리 반지름은 짧은 변 절반과 최대 반지름 중 작은 값", () => {
    morphSamples.forEach((p) => {
      const { pill } = computeArScene(atP(p));
      expect(pill.radius).toBeLessThanOrEqual(AR_PANEL.maxRadius + 1e-6);
      expect(pill.radius).toBeLessThanOrEqual(Math.min(pill.width, pill.height) / 2 + 1e-6);
    });
    const big = sizeWhere(atP, "width", 0.5 * W);
    expect(big.radius).toBeCloseTo(AR_PANEL.maxRadius, 0);
  });

  it("두 축 모두 줄지 않고 커지기만 한다", () => {
    let prev = computeArScene(atP(morphSamples[0])).pill;
    morphSamples.slice(1).forEach((p) => {
      const { pill } = computeArScene(atP(p));
      expect(pill.width).toBeGreaterThanOrEqual(prev.width - 1e-6);
      expect(pill.height).toBeGreaterThanOrEqual(prev.height - 1e-6);
      prev = pill;
    });
  });

  it("단계 사이에서 멈추지 않는다: 커지는 속도(로그 면적)가 한 번 빨라졌다 한 번 느려진다", () => {
    const logArea = morphSamples.map((p) => {
      const { pill } = computeArScene(atP(p));
      return Math.log(pill.width * pill.height);
    });
    const speed = logArea.slice(1).map((v, i) => v - logArea[i]);
    // 속도가 줄다가 다시 느는(멈칫하는) 곳이 없어야 한다
    const peak = speed.indexOf(Math.max(...speed));
    speed.slice(1, peak + 1).forEach((v, i) => expect(v).toBeGreaterThanOrEqual(speed[i] - 1e-9));
    speed.slice(peak + 1).forEach((v, i) => expect(v).toBeLessThanOrEqual(speed[peak + i] + 1e-9));
  });

  it("분할 문구는 pill 가장자리에서 gap 20만큼 바깥에 있다(커지면 밀려난다)", () => {
    for (const p of [0.03, 0.06, 0.1]) {
      const { pill, splitOffset } = computeArScene(atP(p));
      expect(splitOffset).toBeCloseTo(pill.width / 2 + AR_PANEL.splitGap);
    }
  });

  it("모바일은 가로 pill: 주축이 폭, 문구는 위아래로 밀린다", () => {
    const mobile = computeStageLayout(390, 844);
    const atMobile = (p: number) => atP(p, false, mobile);
    const a = sizeWhere(atMobile, "width", AR_PANEL.pillA.main);
    expect(a.height).toBeCloseTo(AR_PANEL.pillA.cross, -1);
    const { splitOffset, isVertical, pill } = computeArScene(atMobile(0.06));
    expect(isVertical).toBe(false);
    expect(pill.width).toBeGreaterThan(pill.height);
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
