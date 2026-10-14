import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computePhones } from "./scene";
import {
  computeScreenOverlay,
  computeScreenOverlayB,
  computeShareRigs,
  computeSplineViewport,
} from "./scene3d";

/** 모바일 랜딩(이슈 #50) — 대표 기기 몇 개에서 같은 규칙이 지켜지는지 본다 */
const DEVICES: readonly [number, number][] = [
  [390, 664], // iPhone 13 사파리(주소창 보임)
  [390, 844],
  [360, 640],
  [430, 932],
];

const setup = (width: number, height: number) => {
  const sections = stackSections({}, height);
  const layout = computeStageLayout(width, height);
  const at = (scrollY: number): SceneFrame => createFrame(scrollY, layout, sections, false);
  const section = (key: string) => {
    const found = sections.find((candidate) => candidate.key === key);
    if (!found) throw new Error(`section not found: ${key}`);
    return found;
  };
  const atProgress = (key: string, p: number) => {
    const s = section(key);
    return at(s.top + p * Math.max(s.height - height, 0));
  };
  return { layout, at, section, atProgress };
};

/** 히어로 3D 폰 두 대(V자)의 씬 폭 — 포스터(폰·그림자 영역) 폭 */
const heroSceneWidth = () => {
  const { fovDeg, distance } = PHONE_3D.camera;
  const canvasHeight = 2 * distance * Math.tan(((fovDeg / 2) * Math.PI) / 180);
  return PHONE_3D.poster.width * canvasHeight * 1.6;
};

describe.each(DEVICES)("모바일 %i×%i (이슈 #50)", (width, height) => {
  const { layout, atProgress } = setup(width, height);
  const S = layout.scale;

  it("히어로 V자 두 대가 화면 폭 안에 들어온다", () => {
    expect(layout.isMobile).toBe(true);
    expect(heroSceneWidth() * S).toBeLessThanOrEqual(width);
  });

  it("공유에서 두 대가 화면 폭 안에 나란히, 겹치지 않고 선다", () => {
    const frame = atProgress("share", TIMELINE.shareXShift[1] + 0.05);
    const { a, b } = computePhones(frame);
    const half = (pose: { scale: number }) => (PHONE.width / 2) * pose.scale;
    expect(a.x - half(a)).toBeGreaterThanOrEqual(0);
    expect(b.x + half(b)).toBeLessThanOrEqual(width);
    expect(a.x + half(a)).toBeLessThanOrEqual(b.x - half(b) + 1);
    expect(a.scale).toBeCloseTo(b.scale);
  });

  it("3D 묶음·화면 오버레이 배율이 CSS 폰 배율(A·B)과 같다", () => {
    for (const frame of [atProgress("record", 0.5), atProgress("share", 0.6)]) {
      const { a, b } = computePhones(frame);
      const rigs = computeShareRigs(frame);
      expect(rigs.a.scale).toBeCloseTo(a.scale / S);
      expect(computeScreenOverlay(frame).phoneScale).toBeCloseTo(a.scale / S);
      if (rigs.b.isVisible) {
        expect(rigs.b.scale).toBeCloseTo(b.scale / S);
        expect(computeScreenOverlayB(frame).phoneScale).toBeCloseTo(b.scale / S);
      }
    }
  });

  it("3D 캔버스는 화면 폭만 그린다(화면 밖을 그리지 않음)", () => {
    const rect = computeSplineViewport(layout);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(width);
  });
});

describe("데스크톱은 그대로", () => {
  const { layout, atProgress } = setup(1440, 900);

  it("기록 구간 폰 크기는 기본 크기(S)다", () => {
    expect(computePhones(atProgress("record", 0.5)).a.scale).toBeCloseTo(layout.scale);
    expect(computeShareRigs(atProgress("record", 0.5)).a.scale).toBeCloseTo(1);
  });
});
