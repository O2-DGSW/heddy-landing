import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, SECTION_HEIGHT_VH, SECTION_KEYS, TIMELINE, type SectionKey } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeScreenOverlay, computeSplineHandoff, computeSplineViewport } from "./scene3d";

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

  it("record(시술기록)부터 recommend(추천) 섹션 끝까지, 그리고 ar 재등장 뒤 ar 끝까지 3D 폰만 보인다(`docs/plans/0008`)", () => {
    for (const [width, height] of [
      [1440, 900],
      [1920, 1080],
      [1024, 700],
    ] as const) {
      const vp = frameForViewport(width, height);
      for (const [key, ps] of [
        ["record", [0, 0.5, 0.99]],
        ["report", [0, 0.5, 0.99]],
        ["recommend", [0, 0.5, 0.99]],
        ["ar", [0.6, 0.8, 0.99]],
      ] as const) {
        for (const p of ps) {
          const { canvasOpacity, cssOpacity } = computeSplineHandoff(vp.at(vp.scrollAt(key, p)));
          expect(canvasOpacity).toBe(1);
          expect(cssOpacity).toBe(0);
        }
      }
    }
  });

  it("ar 다크 패널 구간(재등장 전)에는 3D·CSS 폰 둘 다 보이지 않는다", () => {
    const vp = frameForViewport(1440, 900);
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(vp.at(vp.scrollAt("ar", 0.3)));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(0);
  });

  it("recommend 고정 끝 뒤 3D 폰은 페이지와 함께 위로 빠지고, ar에서 아래에서 올라오며 다시 나타난다", () => {
    const vp = frameForViewport(1440, 900);
    const leaving = computeSplineHandoff(vp.at(vp.scrollAt("recommend", 1) + 300));
    expect(leaving.canvasOpacity).toBe(1);
    expect(leaving.yOffset).toBeCloseTo(-300);
    const back = computeSplineHandoff(vp.at(vp.scrollAt("ar", TIMELINE.arReappearY[1])));
    expect(back.yOffset).toBeCloseTo(0);
    expect(back.canvasOpacity).toBe(1);
    const rising = computeSplineHandoff(vp.at(vp.scrollAt("ar", TIMELINE.arReappearY[0] + 0.02)));
    expect(rising.yOffset).toBeGreaterThan(0);
  });

  it("ar가 끝나면 CSS 폰으로 넘어가고, qrShare 화면 전환(섹션 끝 + 0.35H)보다 먼저 끝난다", () => {
    const vp = frameForViewport(1440, 900);
    const arEndAt = vp.scrollAt("ar", 1);
    const done = computeSplineHandoff(vp.at(arEndAt + PHONE_3D.handoffScrollPx));
    expect(done.canvasOpacity).toBe(0);
    expect(done.cssOpacity).toBe(1);

    const ar = sections.find((section) => section.key === "ar");
    if (!ar) throw new Error("ar not found");
    const screenSwitchAt = ar.end + TIMELINE.screenCrossfadeBand[0] * H;
    expect(arEndAt + PHONE_3D.handoffScrollPx).toBeLessThan(screenSwitchAt);
  });

  it("넘기는 도중 두 opacity의 합은 항상 1이다", () => {
    const vp = frameForViewport(1440, 900);
    const start = vp.scrollAt("ar", 1);
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(vp.at(start + PHONE_3D.handoffScrollPx / 2));
    expect(canvasOpacity).toBeCloseTo(0.5);
    expect(canvasOpacity + cssOpacity).toBeCloseTo(1);
  });

  it("reduced motion이면 3D를 쓰지 않고 CSS 폰만 보인다(화면 오버레이도 없음)", () => {
    expect(computeScreenOverlay(createFrame(0, layout, sections, true)).opacity).toBe(0);
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(createFrame(0, layout, sections, true));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(1);
  });
});

describe("computeScreenOverlay", () => {
  const { screen, camera } = PHONE_3D;
  const deg = Math.PI / 180;

  /** 씬 화면 위의 점(화면 중심 원점, y 위로, px)을 카메라로 투영한 페이지 좌표 */
  const project = (x: number, y: number) => {
    const t = -screen.tiltDeg * deg; // 씬 rotX −8°: 윗변이 뒤로 눕는다
    const y1 = y * Math.cos(t) - screen.z * Math.sin(t);
    const z1 = y * Math.sin(t) + screen.z * Math.cos(t);
    const k = (layout.scale * camera.distance) / (camera.distance - z1);
    return { x: layout.center.x + x * k, y: layout.center.y - y1 * k };
  };

  /** CSS transform(scale·perspective·rotateX·translateZ)을 같은 식으로 풀어 화면 모서리를 구한다 */
  const overlayCorner = (sx: -1 | 1, sy: -1 | 1) => {
    const o = computeScreenOverlay(frameAtScrollY(0));
    const x = (sx * screen.width) / 2;
    const yDown = (sy * screen.height) / 2; // CSS y는 아래로
    const t = o.rotateXDeg * deg;
    const y1 = yDown * Math.cos(t) - o.translateZ * Math.sin(t);
    const z1 = yDown * Math.sin(t) + o.translateZ * Math.cos(t);
    const k = (o.scale * o.perspective) / (o.perspective - z1);
    return { x: o.x + x * k, y: o.y + y1 * k };
  };

  it("오버레이 네 모서리가 3D 폰 화면 네 모서리 투영과 1px 안으로 겹친다", () => {
    for (const sx of [-1, 1] as const) {
      for (const sy of [-1, 1] as const) {
        const expected = project((sx * screen.width) / 2, (-sy * screen.height) / 2);
        const actual = overlayCorner(sx, sy);
        expect(Math.abs(actual.x - expected.x)).toBeLessThan(1);
        expect(Math.abs(actual.y - expected.y)).toBeLessThan(1);
      }
    }
  });

  it("윗변이 아랫변보다 짧다(뒤로 눕힘)", () => {
    const top = overlayCorner(1, -1).x - overlayCorner(-1, -1).x;
    const bottom = overlayCorner(1, 1).x - overlayCorner(-1, 1).x;
    expect(top).toBeLessThan(bottom);
  });

  it("기록 화면 구간에선 숨고, 리포트 섹션에선 상세 화면이 보인다", () => {
    const vp = frameForViewport(1440, 900);
    expect(computeScreenOverlay(vp.at(vp.scrollAt("record", 0.5))).opacity).toBe(0);
    const atReport = computeScreenOverlay(vp.at(vp.scrollAt("report", 0.5)));
    expect(atReport.opacity).toBeCloseTo(1);
    expect(atReport.tabSwitch.slide).toBe(0);
  });

  it("ar 재등장 뒤엔 오버레이가 AR 화면을 보여 주고, 3D 폰과 같이 올라온다", () => {
    const vp = frameForViewport(1440, 900);
    const overlay = computeScreenOverlay(vp.at(vp.scrollAt("ar", 0.7)));
    expect(overlay.isArScreen).toBe(true);
    expect(overlay.opacity).toBeCloseTo(1);
    const risingFrame = vp.at(vp.scrollAt("ar", TIMELINE.arReappearY[0] + 0.02));
    const rising = computeScreenOverlay(risingFrame);
    const { yOffset } = computeSplineHandoff(risingFrame);
    expect(yOffset).toBeGreaterThan(0);
    expect(rising.y).toBeCloseTo(risingFrame.layout.center.y + yOffset);
  });

  it("추천 섹션에선 오버레이가 계속 보이고 추천 화면으로 바뀌어 있다", () => {
    const vp = frameForViewport(1440, 900);
    for (const p of [0, 0.5, 0.99]) {
      const overlay = computeScreenOverlay(vp.at(vp.scrollAt("recommend", p)));
      expect(overlay.opacity).toBeCloseTo(1);
      expect(overlay.tabSwitch.slide).toBe(1);
    }
  });
});
