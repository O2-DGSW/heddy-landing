/**
 * 섹션 순서 · 높이의 단일 출처 (`docs/design/spec.md` §1).
 * 원본 Claude Design 키 대응: s1→hero, s3→archive, s4→record, s5→report,
 * s6→recommend, s7→ar, s8→share, s9→closing. (s2는 원본에서 삭제됨)
 */
export const SECTION_KEYS = [
  "hero",
  "archive",
  "record",
  "report",
  "recommend",
  "ar",
  "share",
  "closing",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** 섹션별 기본 높이(vh). scrollLength=1 기준 값 */
export const SECTION_HEIGHT_VH: Record<SectionKey, number> = {
  hero: 100,
  archive: 220,
  record: 600,
  report: 220,
  recommend: 220,
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
