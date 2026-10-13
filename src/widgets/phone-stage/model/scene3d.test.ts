import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, SECTION_HEIGHT_VH, SECTION_KEYS, TIMELINE, type SectionKey } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computePhones } from "./scene";
import {
  computeScreenOverlay,
  computeScreenOverlayB,
  computeShareRigs,
  computeSplineHandoff,
  computeSplineViewport,
  fitShareRigB,
} from "./scene3d";

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

  it("record부터 recommend 끝까지, 그리고 ar 재등장 뒤 페이지 끝까지 3D 폰만 보인다(`docs/plans/0008`, `0009`)", () => {
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
        ["share", [0, 0.5, 0.99]],
        ["closing", [0.5]],
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

  it("reduced motion이면 3D를 쓰지 않고 CSS 폰만 보인다(화면 오버레이도 없음)", () => {
    expect(computeScreenOverlay(createFrame(0, layout, sections, true)).opacity).toBe(0);
    const { canvasOpacity, cssOpacity } = computeSplineHandoff(createFrame(0, layout, sections, true));
    expect(canvasOpacity).toBe(0);
    expect(cssOpacity).toBe(1);
  });
});

describe("computeShareRigs (share: 폰 두 대 3D 배치, `docs/plans/0009`)", () => {
  const share = sections.find((section) => section.key === "share");
  if (!share) throw new Error("share not found");
  const atShare = (p: number) => frameAtScrollY(share.top + p * (share.height - H));
  const S = layout.scale;

  it("share 전에는 두 묶음 다 제자리(히어로 합체 그대로)", () => {
    const rigs = computeShareRigs(frameAtScrollY(0));
    expect(rigs.a.x).toBe(0);
    expect(rigs.b).toEqual({ x: 0, y: 0, rotateZDeg: 0, isVisible: false });
  });

  it("CSS 폰과 같은 자리: A는 cx − 0.13W, B는 cx + 0.13W(씬 단위 = px / S)", () => {
    const frame = atShare(TIMELINE.shareXShift[1]);
    const { a, b } = computePhones(frame);
    const rigs = computeShareRigs(frame);
    expect(rigs.a.x).toBeCloseTo((a.x - layout.center.x) / S);
    expect(rigs.b.x).toBeCloseTo((b.x - layout.center.x) / S);
    expect(rigs.b.rotateZDeg).toBeCloseTo(0);
    expect(rigs.b.isVisible).toBe(true);
  });

  it("B가 오른쪽 밖으로 다 빠지면 숨긴다 — 끝까지 내려도 퇴장이 1px 덜 끝나 그림자가 가장자리에 남지 않게", () => {
    const frame = frameAtScrollY(share.end - 1);
    expect(computePhones(frame).b.opacity).toBe(1);
    expect(computeShareRigs(frame).b.isVisible).toBe(false);
  });

  it("들어올 때는 화면 밖에서부터 보인다(그림자가 먼저 들어온다)", () => {
    expect(computeShareRigs(atShare(TIMELINE.shareXShift[0] + 0.001)).b.isVisible).toBe(true);
  });

  it("B가 들어오는 중엔 기울어 있다(CSS 회전과 반대 부호 = 씬 z축 반시계)", () => {
    const frame = atShare(TIMELINE.shareXShift[0] + 0.03);
    const { b } = computePhones(frame);
    expect(computeShareRigs(frame).b.rotateZDeg).toBeCloseTo(-b.rotate);
    expect(b.rotate).toBeGreaterThan(0);
  });

  it("B 화면 오버레이는 B 묶음과 같은 씬 위치·기울기로 투영되고, B가 보일 때만 보인다", () => {
    const frame = atShare(0.6);
    const overlay = computeScreenOverlayB(frame);
    const rigs = computeShareRigs(frame);
    expect(overlay.sceneX).toBeCloseTo(rigs.b.x);
    expect(overlay.rotateZDeg).toBeCloseTo(-rigs.b.rotateZDeg);
    expect(overlay.opacity).toBe(1);
    expect(computeScreenOverlayB(atShare(0.2)).opacity).toBe(0);
  });

  it("A 화면 오버레이도 A 묶음을 따라 옮겨 간다", () => {
    const frame = atShare(0.6);
    expect(computeScreenOverlay(frame).sceneX).toBeCloseTo(computeShareRigs(frame).a.x);
  });
});

describe("fitShareRigB (Spline이 쥔 PhoneB 자세를 묶음으로 되돌린다)", () => {
  /** 히어로 합체 끝 PhoneB "Gone" 상태: A 뒤 z −40, 크기 1%(Spline Scroll 이벤트가 계속 다시 쓴다) */
  const GONE = { x: 0, y: 0, z: -40, scale: 2.2284 };
  const PHONE_SCALE = 222.84;

  /** 묶음 변환을 PhoneB 로컬 위치에 적용한 월드 위치·크기 */
  const toWorld = (rig: ReturnType<typeof fitShareRigB>, local: typeof GONE) => {
    const t = rig.rotateZDeg * (Math.PI / 180);
    const lx = local.x * rig.scale;
    const ly = local.y * rig.scale;
    return {
      x: rig.x + lx * Math.cos(t) - ly * Math.sin(t),
      y: rig.y + lx * Math.sin(t) + ly * Math.cos(t),
      z: rig.z + local.z * rig.scale,
      scale: local.scale * rig.scale,
    };
  };

  it("B가 안 보이면 묶음은 제자리 — 히어로 합체는 씬 그대로", () => {
    const rig = fitShareRigB({ x: 0, y: 0, rotateZDeg: 0, isVisible: false }, GONE, PHONE_SCALE);
    expect(rig).toEqual({ x: 0, y: 0, z: 0, rotateZDeg: 0, scale: 1 });
  });

  it("B가 보이면 PhoneB가 A와 같은 크기로, A와 같은 면(z 0)의 목표 자리에 선다", () => {
    const target = { x: 213, y: -12, rotateZDeg: 6, isVisible: true };
    const world = toWorld(fitShareRigB(target, GONE, PHONE_SCALE), GONE);
    expect(world.x).toBeCloseTo(213);
    expect(world.y).toBeCloseTo(-12);
    expect(world.z).toBeCloseTo(0);
    expect(world.scale).toBeCloseTo(PHONE_SCALE);
  });

  it("PhoneB가 로컬에서 비켜 있어도(회전 포함) 목표 자리에 맞춘다", () => {
    const local = { x: 3, y: -2, z: -40, scale: 2.2284 };
    const target = { x: -50, y: 30, rotateZDeg: -10, isVisible: true };
    const world = toWorld(fitShareRigB(target, local, PHONE_SCALE), local);
    expect(world.x).toBeCloseTo(-50);
    expect(world.y).toBeCloseTo(30);
    expect(world.z).toBeCloseTo(0);
  });

  it("PhoneB 크기가 0이어도 무한대로 튀지 않는다", () => {
    const rig = fitShareRigB(
      { x: 1, y: 1, rotateZDeg: 0, isVisible: true },
      { ...GONE, scale: 0 },
      PHONE_SCALE,
    );
    expect(Number.isFinite(rig.scale)).toBe(true);
    expect(Number.isFinite(rig.z)).toBe(true);
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
