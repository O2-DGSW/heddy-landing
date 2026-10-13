import type { ProcedureRecord } from "./types";

/** record 섹션 기록 카드 한 장 */
export type RecordCard = ProcedureRecord & {
  /** 카드 이미지(`public/screens/record/card-NN.png`)·Spline 오브젝트(`CardNN`) 번호 */
  cardNo: number;
};

/** 카드 이미지·Spline 오브젝트 수(`Card01~12`). 이 중 `RECORD_CARDS`에 없는 카드는 숨긴다 */
export const RECORD_CARD_IMAGE_COUNT = 12;

/**
 * record 섹션 기록 카드(오래된 순). 카드 이미지(Spline `CardMat01~12`)에 적힌 날짜·스타일과
 * 같아야 한다 — 좌측 큰 날짜가 이 값을 쓴다. 2026년 카드(07~12)부터 쌓는다(이슈 #42, 2025년 01~06은 숨김).
 * 다른 화면(홈·추천·공유)의 `MOCK_RECORDS`와는 별개다.
 */
export const RECORD_CARDS: readonly RecordCard[] = [
  { id: "c7", cardNo: 7, date: "2026.01", title: "가르마 댄디컷" },
  { id: "c8", cardNo: 8, date: "2026.03", title: "다운펌" },
  { id: "c9", cardNo: 9, date: "2026.05", title: "시스루 애즈펌" },
  { id: "c10", cardNo: 10, date: "2026.06", title: "가르마 애즈펌" },
  { id: "c11", cardNo: 11, date: "2026.07", title: "가르마 댄디컷" },
  { id: "c12", cardNo: 12, date: "2026.09", title: "다운펌" },
];

/** 카드 번호 → 두 자리 문자열(`07`) — 이미지·Spline 오브젝트 이름에 쓴다 */
export const recordCardNo = (cardNo: number): string => String(cardNo).padStart(2, "0");
