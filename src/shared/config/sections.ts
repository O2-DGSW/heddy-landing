/**
 * 섹션 순서 · 높이의 단일 출처 (`docs/design/spec.md` §1).
 * 원본 Claude Design 키 대응: s4→record, s5→report, s6→recommend, s7→ar, s8→share, s9→closing.
 * 2026-10-15(이슈 #71): 첫 화면은 소개 애니메이션(intro)이고, 히어로(s1)·아카이브(s3)는 뺐다.
 */
export const SECTION_KEYS = ["intro", "record", "report", "recommend", "ar", "share", "closing"] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** 섹션별 기본 높이(vh). scrollLength=1 기준 값 */
export const SECTION_HEIGHT_VH: Record<SectionKey, number> = {
  /**
   * 소개 애니메이션은 화면에 고정돼 있고, 섹션은 3D 폰 합체 구간(Spline Scroll 이벤트, 페이지 스크롤 1678px까지)을
   * 덮을 만큼 길다 — 합체는 폰을 숨긴 채 끝나고 record에서 한 대로 나타난다. 실제 높이는 `INTRO_SECTION_MIN_PX`와 큰 쪽
   */
  intro: 280,
  record: 600,
  report: 220,
  /** 카드 팝아웃 → 머무름 → 복귀 → 화면 스크롤을 읽을 수 있게 늘림(220 → 320, `docs/plans/0007`) */
  recommend: 320,
  ar: 600,
  share: 320,
  closing: 100,
};

/**
 * 섹션 실제 높이(vh)를 구한다.
 * 높이 = 100 + (base - 100) × scrollLength (scrollLength 기본 1)
 */
export const sectionHeightVh = (key: SectionKey, scrollLength = 1): number => {
  const base = SECTION_HEIGHT_VH[key];
  return 100 + (base - 100) * scrollLength;
};
