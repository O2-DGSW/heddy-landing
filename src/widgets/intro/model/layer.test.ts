import { describe, expect, it } from "vitest";

import { layerFilter, layerOpacity, layerTransform } from "./layer";

describe("layerTransform (AE 레이어 → CSS)", () => {
  it("위치로 옮긴 뒤 회전·크기(%)를 기준점에서 적용한다", () => {
    expect(layerTransform({ x: 10, y: 20, scale: 50, rotate: -6 })).toBe(
      "translate(10px, 20px) rotate(-6deg) scale(0.5, 0.5)",
    );
  });

  it("가로·세로 크기를 따로 줄 수 있고, 없으면 100%", () => {
    expect(layerTransform({ x: 0, y: 0, scaleX: 30 })).toBe("translate(0px, 0px) scale(0.3, 1)");
  });
});

describe("layerOpacity · layerFilter", () => {
  it("불투명도 0~100 → 0~1, 기본 1", () => {
    expect(layerOpacity({ x: 0, y: 0, opacity: 45 })).toBe("0.45");
    expect(layerOpacity({ x: 0, y: 0 })).toBe("1");
  });

  it("흐림이 없으면 filter를 끈다", () => {
    expect(layerFilter({ x: 0, y: 0, blur: 0 })).toBe("none");
    expect(layerFilter({ x: 0, y: 0, blur: 10 })).toBe("blur(5px)");
  });
});
