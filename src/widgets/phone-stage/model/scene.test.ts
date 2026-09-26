import { describe, expect, it } from "vitest";

import {
  SECTION_HEIGHT_VH,
  SECTION_KEYS,
  type SectionKey,
} from "@/shared/config";
import {
  computeStageLayout,
  createFrame,
  stackSections,
  type SceneFrame,
} from "@/shared/lib/scroll";

import { computePhones, computeScreens } from "./scene";

const W = 1440;
const H = 900;

const heightsPx = Object.fromEntries(
  SECTION_KEYS.map((key) => [key, (SECTION_HEIGHT_VH[key] / 100) * H]),
) as Record<SectionKey, number>;

const sections = stackSections(heightsPx, H);
const layout = computeStageLayout(W, H);
const documentHeight = sections[sections.length - 1].end;

const frameAtScrollY = (scrollY: number): SceneFrame =>
  createFrame(scrollY, layout, sections, false);

/** 특정 섹션의 내부 진행도(p, 0~1)에 해당하는 scrollY로 프레임을 만든다 */
const frameAtSectionProgress = (key: SectionKey, p: number): SceneFrame => {
  const section = sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`section not found: ${key}`);
  const denom = Math.max(section.height - H, 1);
  return frameAtScrollY(section.top + p * denom);
};

describe("computePhones", () => {
  it("hero에서 A·B 회전이 ∓12°다", () => {
    const { a, b } = computePhones(frameAtScrollY(0));
    expect(a.rotate).toBeCloseTo(-12);
    expect(b.rotate).toBeCloseTo(12);
  });

  it("archive 0.72 지점에서 둘 다 회전 0·중심 일치다", () => {
    const { a, b } = computePhones(frameAtSectionProgress("archive", 0.72));
    expect(a.rotate).toBeCloseTo(0);
    expect(b.rotate).toBeCloseTo(0);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });

  it("archive 0.86 이후 B 불투명도가 0이다", () => {
    const { b } = computePhones(frameAtSectionProgress("archive", 0.86));
    expect(b.opacity).toBeCloseTo(0);
  });

  it("ar 0.3에서 A 불투명도가 0이다", () => {
    const { a } = computePhones(frameAtSectionProgress("ar", 0.3));
    expect(a.opacity).toBeCloseTo(0);
  });

  it("ar 0.56에서 A가 제자리(스테이지 중심)로 돌아온다", () => {
    const { a } = computePhones(frameAtSectionProgress("ar", 0.56));
    expect(a.y).toBeCloseTo(layout.center.y);
  });

  it("share 0.32에서 A.x = cx - 0.13W, B.x = cx + 0.13W다", () => {
    const { a, b } = computePhones(frameAtSectionProgress("share", 0.32));
    expect(a.x).toBeCloseTo(layout.center.x - 0.13 * W);
    expect(b.x).toBeCloseTo(layout.center.x + 0.13 * W);
  });
});

describe("computeScreens", () => {
  it("시작은 홈 화면이다", () => {
    const { a } = computeScreens(frameAtScrollY(0));
    expect(a.home).toBeCloseTo(1);
    expect(a.record).toBeCloseTo(0);
    expect(a.report).toBeCloseTo(0);
    expect(a.recommend).toBeCloseTo(0);
    expect(a.ar).toBeCloseTo(0);
    expect(a.qrShare).toBeCloseTo(0);
  });

  it("어느 지점이든 A 화면 opacity 합은 1을 넘지 않는다", () => {
    const step = 50;
    for (let scrollY = 0; scrollY <= documentHeight; scrollY += step) {
      const { a } = computeScreens(frameAtScrollY(scrollY));
      const sum = a.home + a.record + a.report + a.recommend + a.ar + a.qrShare;
      expect(sum).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});
