import { describe, expect, it } from "vitest";

import { introSceneIndices, isInScene, loopTime } from "./clock";
import { applySceneVisibility } from "./sceneVisibility";

describe("인트로 반복 경계", () => {
  it("물결 장면이 끝나거나 재생이 처음으로 돌아가면 자식 visibility와 무관하게 숨긴다", () => {
    const root = { style: { display: "", visibility: "" } };
    for (const time of [34.5, 36.7, 44.9, 45.1, 79.5, 90.1]) {
      const active = isInScene(loopTime(time), [33.6, 36.6]);
      applySceneVisibility(root as unknown as HTMLElement, active);
      expect(root.style.display).toBe(active ? "" : "none");
    }
  });

  it("장면 경계와 두 번째 반복에서도 현재·다음 장면만 준비한다", () => {
    expect(introSceneIndices(0)).toEqual([0, 1]);
    expect(introSceneIndices(3)).toEqual([1, 2]);
    expect(introSceneIndices(34.5)).toEqual([12, 13]);
    expect(introSceneIndices(44.9)).toEqual([14, 0]);
    expect(introSceneIndices(loopTime(45.1))).toEqual([0, 1]);
    expect(introSceneIndices(loopTime(79.5))).toEqual([12, 13]);
  });
});
