import { describe, expect, it } from "vitest";

import { STABLE_VIEWPORT } from "@/shared/config";

import { stableViewportSize } from "./stableViewport";

describe("stableViewportSize (모바일 주소창, 이슈 #50)", () => {
  const prev = { width: 390, height: 664 };

  it("처음엔 지금 크기 그대로", () => {
    expect(stableViewportSize(null, { width: 390, height: 664 }, true)).toEqual({ width: 390, height: 664 });
  });

  it("터치 기기에서 주소창이 접히고 펴지는 높이 변화는 무시한다(폰 크기가 출렁이지 않게)", () => {
    expect(stableViewportSize(prev, { width: 390, height: 664 + 83 }, true)).toEqual(prev);
    expect(stableViewportSize(prev, { width: 390, height: 664 + STABLE_VIEWPORT.toolbarSlackPx }, true)).toEqual(prev);
  });

  it("폭이 바뀌거나(회전) 높이가 크게 바뀌면 새 크기를 쓴다", () => {
    expect(stableViewportSize(prev, { width: 664, height: 390 }, true)).toEqual({ width: 664, height: 390 });
    expect(stableViewportSize(prev, { width: 390, height: 300 }, true)).toEqual({ width: 390, height: 300 });
  });

  it("터치가 아니면(데스크톱 창 크기 조절) 항상 새 크기", () => {
    expect(stableViewportSize(prev, { width: 390, height: 700 }, false)).toEqual({ width: 390, height: 700 });
  });
});
