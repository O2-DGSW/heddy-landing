/**
 * 모바일 섹션 카드 비율(카드 폭 = 1 기준). 카드 안 평면 목업은 처음엔 아래가 잘려 있다가, 스크롤하면 위로 조금
 * 올라와 카드 아래에 걸친 채 멈춘다(이슈 #52). 카드가 화면을 지나는 내내 천천히 움직인다(theme.css `scroll-rise`). `MobileVisualView` 클래스와 같은 값이어야 한다.
 */
export const MOBILE_CARD = {
  /** 카드 높이 / 폭 (aspect-[1/1.08]) */
  aspect: 1.08,
  /** 목업 폭 / 카드 폭 (w-[64%]) */
  phoneWidthRatio: 0.64,
  /** 목업 위 여백 / 카드 폭 (pt-[9%]) */
  topPaddingRatio: 0.09,
  /** 목업 높이 / 폭 (phone-frame.svg 906/446) */
  frameAspect: 906 / 446,
  /** 카드 아래로 잘린 부분 중 스크롤하면 드러나는 비율 — 살짝만 움직여야 자연스럽다(0.42 → 0.25) */
  revealFraction: 0.25,
} as const;

/** 목업이 올라갈 거리 — 목업 자기 높이 대비 %(translateY, 음수 = 위로) */
export const phoneRisePercent = (): number => {
  const { aspect, phoneWidthRatio, topPaddingRatio, frameAspect, revealFraction } = MOBILE_CARD;
  const phoneHeight = phoneWidthRatio * frameAspect;
  const cutOff = topPaddingRatio + phoneHeight - aspect;
  return -((cutOff * revealFraction) / phoneHeight) * 100;
};
