import { describe, expect, it } from "vitest";

import { INTRO } from "@/shared/config";

import { introSceneIndices, isInScene, loopTime } from "./clock";
import { applySceneVisibility } from "./sceneVisibility";

const D = INTRO.duration;

describe("인트로 반복 경계", () => {
  it("물결 장면이 끝나거나 재생이 처음으로 돌아가면 자식 visibility와 무관하게 숨긴다", () => {
    const root = { style: { display: "", visibility: "" } };
    for (const time of [36.5, 38.9, D - 0.1, D + 0.1, D + 36.5, D + 45]) {
      const active = isInScene(loopTime(time), INTRO.scenes.s13);
      applySceneVisibility(root as unknown as HTMLElement, active);
      expect(root.style.display).toBe(active ? "" : "none");
    }
  });

  it("장면 경계와 두 번째 반복에서도 현재·다음 장면만 준비한다", () => {
    expect(introSceneIndices(0)).toEqual([0, 1]);
    expect(introSceneIndices(3)).toEqual([1, 2]);
    expect(introSceneIndices(36.5)).toEqual([12, 13]);
    expect(introSceneIndices(D - 0.1)).toEqual([14, 0]);
    expect(introSceneIndices(loopTime(D + 0.1))).toEqual([0, 1]);
    expect(introSceneIndices(loopTime(D + 36.5))).toEqual([12, 13]);
  });
});
