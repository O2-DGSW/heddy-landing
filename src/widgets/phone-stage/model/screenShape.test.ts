import { describe, expect, it } from "vitest";

import { PHONE_3D } from "@/shared/config";

import { squirclePath, squirclePoints } from "./screenShape";

const { width, height, corner } = PHONE_3D.screen;

describe("squirclePoints (폰 화면 윤곽, 2026-10-15)", () => {
  const points = squirclePoints(width, height, corner.radius, corner.exponent);

  it("모든 점이 화면 사각형 안에 있고 네 변에 닿는다", () => {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(0);
    expect(Math.max(...xs)).toBeCloseTo(width);
    expect(Math.min(...ys)).toBeCloseTo(0);
    expect(Math.max(...ys)).toBeCloseTo(height);
  });

  it("모서리는 반경만큼 둥글다: 왼쪽 위 모서리 꼭짓점(0, 0)에서 떨어져 있고, 반경 밖 변은 곧다", () => {
    const nearest = Math.min(...points.map(([x, y]) => Math.hypot(x, y)));
    expect(nearest).toBeGreaterThan(corner.radius * 0.2);
    expect(points.some(([x, y]) => y === 0 && x === corner.radius)).toBe(true);
  });

  it("지수 2면 원 모서리다(45° 지점이 원 위에 있다)", () => {
    const r = 40;
    const circle = squirclePoints(width, height, r, 2);
    const center = [r, r];
    for (const [x, y] of circle.filter(([px, py]) => px < r && py < r)) {
      expect(Math.hypot(x - center[0], y - center[1])).toBeCloseTo(r, 5);
    }
  });
});

describe("squirclePath", () => {
  it("clip-path에 넣을 닫힌 경로 문자열", () => {
    const d = squirclePath(width, height, corner.radius, corner.exponent);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith(" Z")).toBe(true);
  });
});
