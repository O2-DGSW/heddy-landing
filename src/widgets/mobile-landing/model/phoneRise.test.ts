import { describe, expect, it } from "vitest";

import { MOBILE_CARD, phoneRisePercent } from "./phoneRise";

describe("phoneRisePercent (스크롤하면 폰이 카드에 걸칠 만큼 올라온다, 이슈 #52)", () => {
  const { aspect, phoneWidthRatio, topPaddingRatio, frameAspect } = MOBILE_CARD;
  // 카드 폭 1 기준 길이
  const phoneHeight = phoneWidthRatio * frameAspect;
  const cardHeight = aspect;
  const startBottom = topPaddingRatio + phoneHeight;
  const endBottom = startBottom + (phoneRisePercent() / 100) * phoneHeight;

  it("처음엔 폰 아랫부분이 카드 아래로 잘려 있다", () => {
    expect(startBottom).toBeGreaterThan(cardHeight);
  });

  it("끝까지 올리지 않는다: 다 올라와도 폰이 카드 아래에 걸쳐 있다", () => {
    expect(endBottom).toBeGreaterThan(cardHeight);
  });

  it("그래도 잘린 부분의 절반쯤은 드러난다", () => {
    const shown = (startBottom - endBottom) / (startBottom - cardHeight);
    expect(shown).toBeGreaterThan(0.4);
    expect(shown).toBeLessThan(0.6);
  });

  it("윗부분(상태바)은 거의 잘리지 않는다: 폰 위 끝이 카드 위 끝 근처에 머문다", () => {
    const top = topPaddingRatio + (phoneRisePercent() / 100) * phoneHeight;
    expect(top).toBeGreaterThan(-0.05);
  });
});
