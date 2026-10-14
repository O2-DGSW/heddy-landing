import { describe, expect, it } from "vitest";

import { MOBILE_CARD, phoneRisePercent } from "./phoneRise";

describe("phoneRisePercent (스크롤하면 폰 아랫부분이 보인다, 이슈 #52)", () => {
  const { aspect, phoneWidthRatio, topPaddingRatio, frameAspect, bottomMarginRatio } = MOBILE_CARD;
  // 카드 폭 1 기준 길이
  const phoneHeight = phoneWidthRatio * frameAspect;
  const cardHeight = aspect;

  it("처음엔 폰 아랫부분이 카드 아래로 잘려 있다", () => {
    expect(topPaddingRatio + phoneHeight).toBeGreaterThan(cardHeight);
  });

  it("다 올라오면 폰 아래 끝이 카드 안(아래 여백 위)에 들어온다", () => {
    const rise = (-phoneRisePercent() / 100) * phoneHeight;
    const bottom = topPaddingRatio + phoneHeight - rise;
    expect(bottom).toBeCloseTo(cardHeight - bottomMarginRatio, 5);
  });

  it("올라가는 방향(위, 음수 %)이고 폰 높이의 절반을 넘지 않는다", () => {
    expect(phoneRisePercent()).toBeLessThan(0);
    expect(phoneRisePercent()).toBeGreaterThan(-50);
  });
});
