import type { ProcedureRecord } from "./types";

/**
 * record 섹션 기록 카드 12장(오래된 순). 카드 이미지(Spline `CardMat01~12`)에 적힌
 * 날짜·스타일과 같아야 한다 — 좌측 큰 날짜가 이 값을 쓴다.
 * 다른 화면(홈·추천·공유)의 `MOCK_RECORDS`와는 별개다.
 */
export const RECORD_CARDS: readonly ProcedureRecord[] = [
  { id: "c1", date: "2025.03", title: "크롭컷" },
  { id: "c2", date: "2025.04", title: "돌프컷" },
  { id: "c3", date: "2025.06", title: "포마드컷" },
  { id: "c4", date: "2025.07", title: "스핀스왈로우컷" },
  { id: "c5", date: "2025.09", title: "다운펌" },
  { id: "c6", date: "2025.12", title: "시스루 댄디컷" },
  { id: "c7", date: "2026.01", title: "가르마 댄디컷" },
  { id: "c8", date: "2026.03", title: "다운펌" },
  { id: "c9", date: "2026.05", title: "시스루 애즈펌" },
  { id: "c10", date: "2026.06", title: "가르마 애즈펌" },
  { id: "c11", date: "2026.07", title: "가르마 댄디컷" },
  { id: "c12", date: "2026.09", title: "다운펌" },
];
