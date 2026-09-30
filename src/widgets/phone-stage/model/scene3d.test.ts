import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, SECTION_HEIGHT_VH, SECTION_KEYS, type SectionKey } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeSplineHandoff, computeSplineViewport } from "./scene3d";

const W = 1440;
const H = 900;

const heightsPx = Object.fromEntries(
  SECTION_KEYS.map((key) => [key, (SECTION_HEIGHT_VH[key] / 100) * H]),
) as Record<SectionKey, number>;

const sections = stackSections(heightsPx, H);
const layout = computeStageLayout(W, H);

const frameAtScrollY = (scrollY: number): SceneFrame => createFrame(scrollY, layout, sections, false);

const frameAtSectionProgress = (key: SectionKey, p: number): SceneFrame => {
  const section = sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`section not found: ${key}`);
  const denom = Math.max(section.height - H, 1);
  return frameAtScrollY(section.top + p * denom);
};

/** 다른 뷰포트 크기로 섹션을 다시 쌓아 프레임을 만든다 */
const frameForViewport = (width: number, height: number) => {
  const vpSections = stackSections({}, height);
  const vpLayout = computeStageLayout(width, height);
  const scrollAt = (key: SectionKey, p: number): number => {
    const section = vpSections.find((candidate) => candidate.key === key);
    if (!section) throw new Error(`section not found: ${key}`);
    return section.top + p * Math.max(section.height - height, 1);
  };
  const at = (scrollY: number): SceneFrame => createFrame(scrollY, vpLayout, vpSections, false);
  return { scrollAt, at };
};

describe("computeSplineViewport", () => {
  it("캔버스 중심이 CSS 폰 A 중심과 같다", () => {
    const rect = computeSplineViewport(layout);
    expect(rect.left + rect.width / 2).toBeCloseTo(layout.center.x);
    expect(rect.top + rect.height / 2).toBeCloseTo(layout.center.y);
  });

  it("월드 원점의 폰(높이 615)이 CSS 폰 A와 같은 높이로 보인다", () => {
    const rect = computeSplineViewport(layout);
    const { fovDeg, distance } = PHONE_3D.camera;
    const visibleHeight = 2 * distance * Math.tan(((fovDeg / 2) * Math.PI) / 180);
    expect((PHONE.height / visibleHeight) * rect.height).toBeCloseTo(PHONE.height * layout.scale);
  });
});

describe("computeSplineHandoff", () => {
  it("hero에서는 3D 캔버스만 보인다", () => {
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(frameAtScrollY(0));
    expect(canvasOpacity).toBe(1);
    expect(cssOpacity).toBe(0);
  });

  it("작은 화면: CSS 폰은 먼저 합쳐져도 Spline 합체(px 고정)가 끝날 때까지 넘기지 않는다", () => {
    const small = frameForViewport(1024, 768);
    const cssMergedAt = small.scrollAt("archive", 0.72);
    expect(cssMergedAt).toBeLessThan(PHONE_3D.mergeEndScrollPx);
    expect(computeSplineHandoff(small.at(PHONE_3D.mergeEndScrollPx - 1)).canvasOpacity).toBe(1);
  });

  it("큰 화면: Spline이 먼저 합쳐져도 CSS 폰 합체(archive 0.72)가 끝날 때까지 넘기지 않는다", () => {
    const big = frameForViewport(1920, 1080);
    const cssMergedAt = big.scrollAt("archive", 0.72);
    expect(cssMergedAt).toBeGreaterThan(PHONE_3D.mergeEndScrollPx);
    expect(computeSplineHandoff(big.at(cssMergedAt - 1)).canvasOpacity).toBe(1);
    expect(computeSplineHandoff(big.at(cssMergedAt + PHONE_3D.handoffScrollPx)).canvasOpacity).toBe(0);
  });

  it("넘기는 도중 두 opacity의 합은 항상 1이다", () => {
    const start = Math.max(PHONE_3D.mergeEndScrollPx, frameAtSectionProgress("archive", 0.72).scrollY);
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(
      frameAtScrollY(start + PHONE_3D.handoffScrollPx / 2),
    );
    expect(canvasOpacity).toBeCloseTo(0.5);
    expect(canvasOpacity + cssOpacity).toBeCloseTo(1);
  });

  it("archive를 지나면 CSS 폰으로 완전히 넘어가 있다", () => {
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(frameAtSectionProgress("record", 0));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(1);
  });

  it("reduced motion이면 3D를 쓰지 않고 CSS 폰만 보인다", () => {
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(createFrame(0, layout, sections, true));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(1);
  });
});
