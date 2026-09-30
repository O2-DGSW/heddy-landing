import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, SECTION_HEIGHT_VH, SECTION_KEYS, TIMELINE, type SectionKey } from "@/shared/config";
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

  it("archive(흩어진 기록이, 한 화면으로) 섹션 끝까지 3D 폰만 보인다", () => {
    for (const [width, height] of [
      [1440, 900],
      [1920, 1080],
    ] as const) {
      const vp = frameForViewport(width, height);
      const { canvasOpacity, cssOpacity } = computeSplineHandoff(vp.at(vp.scrollAt("archive", 0.99)));
      expect(canvasOpacity).toBe(1);
      expect(cssOpacity).toBe(0);
    }
  });

  it("archive가 끝나면 CSS 폰으로 넘어가고, record 화면 전환(섹션 끝 + 0.35H)보다 먼저 끝난다", () => {
    const vp = frameForViewport(1440, 900);
    const archiveEndAt = vp.scrollAt("archive", 1);
    const done = computeSplineHandoff(vp.at(archiveEndAt + PHONE_3D.handoffScrollPx));
    expect(done.canvasOpacity).toBe(0);
    expect(done.cssOpacity).toBe(1);

    const archive = sections.find((section) => section.key === "archive");
    if (!archive) throw new Error("archive not found");
    const screenSwitchAt = archive.end + TIMELINE.screenCrossfadeBand[0] * H;
    expect(archiveEndAt + PHONE_3D.handoffScrollPx).toBeLessThan(screenSwitchAt);
  });

  it("아주 작은 화면: Spline 합체(px 고정)가 끝날 때까지는 넘기지 않는다", () => {
    const tiny = frameForViewport(1024, 700);
    expect(tiny.scrollAt("archive", 1)).toBeLessThan(PHONE_3D.mergeEndScrollPx);
    expect(computeSplineHandoff(tiny.at(PHONE_3D.mergeEndScrollPx - 1)).canvasOpacity).toBe(1);
  });

  it("넘기는 도중 두 opacity의 합은 항상 1이다", () => {
    const vp = frameForViewport(1440, 900);
    const start = Math.max(PHONE_3D.mergeEndScrollPx, vp.scrollAt("archive", 1));
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(vp.at(start + PHONE_3D.handoffScrollPx / 2));
    expect(canvasOpacity).toBeCloseTo(0.5);
    expect(canvasOpacity + cssOpacity).toBeCloseTo(1);
  });

  it("reduced motion이면 3D를 쓰지 않고 CSS 폰만 보인다", () => {
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(createFrame(0, layout, sections, true));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(1);
  });
});
