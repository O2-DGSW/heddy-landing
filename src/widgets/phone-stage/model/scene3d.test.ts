import { describe, expect, it } from "vitest";

import { PHONE, PHONE_3D, SECTION_HEIGHT_VH, SECTION_KEYS, type SectionKey } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computePhones3D, projectToScreen } from "./scene3d";

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

describe("computePhones3D", () => {
  it("hero에서는 Spline 배치 그대로 두 폰이 기울어져 있다", () => {
    const { a, b } = computePhones3D(frameAtScrollY(0));
    expect(a).toMatchObject(PHONE_3D.heroStart.a);
    expect(b).toMatchObject(PHONE_3D.heroStart.b);
    expect(b.isVisible).toBe(true);
  });

  it("archive 0.72에서 A는 합쳐진 자세, B는 A 바로 뒤에 숨는다", () => {
    const { a, b } = computePhones3D(frameAtSectionProgress("archive", 0.72));
    expect(a).toMatchObject(PHONE_3D.mergedA);
    expect(b.x).toBeCloseTo(a.x);
    expect(b.y).toBeCloseTo(a.y);
    expect(b.z).toBeCloseTo(PHONE_3D.mergedBBehindZ);
    expect(b.rotX).toBeCloseTo(a.rotX);
    expect(b.rotY).toBeCloseTo(a.rotY);
    expect(b.rotZ).toBeCloseTo(a.rotZ);
  });

  it("B는 A보다 늦게 모인다", () => {
    const frame = frameAtSectionProgress("archive", 0.3);
    const { a, b } = computePhones3D(frame);
    const aDone = (a.x - PHONE_3D.heroStart.a.x) / (PHONE_3D.mergedA.x - PHONE_3D.heroStart.a.x);
    const bDone = (b.x - PHONE_3D.heroStart.b.x) / (PHONE_3D.mergedA.x - PHONE_3D.heroStart.b.x);
    expect(bDone).toBeLessThan(aDone);
  });

  it("3D 캔버스는 hero에서 보이고 archive 0.86 이후 CSS 폰으로 완전히 넘어간다", () => {
    const start = computePhones3D(frameAtScrollY(0));
    expect(start.canvasOpacity).toBe(1);
    expect(start.cssOpacity).toBe(0);

    const after = computePhones3D(frameAtSectionProgress("archive", 0.86));
    expect(after.canvasOpacity).toBe(0);
    expect(after.cssOpacity).toBe(1);
    expect(after.b.isVisible).toBe(false);
  });

  it("합쳐진 A는 화면에서 CSS 폰 A와 같은 중심·높이로 보인다", () => {
    const { stage } = computePhones3D(frameAtSectionProgress("archive", 0.72));
    const center = projectToScreen(stage, 0, 0, layout);
    const top = projectToScreen(stage, 0, PHONE.height / 2, layout);
    expect(center.x).toBeCloseTo(layout.center.x);
    expect(center.y).toBeCloseTo(layout.center.y);
    expect((center.y - top.y) * 2).toBeCloseTo(PHONE.height * layout.scale);
  });

  it("reduced motion이면 3D를 쓰지 않고 CSS 폰만 보인다", () => {
    const frame = createFrame(0, layout, sections, true);
    const scene = computePhones3D(frame);
    expect(scene.canvasOpacity).toBe(0);
    expect(scene.cssOpacity).toBe(1);
  });
});
