import type { ProcedureRecord } from "./types";

/** 목데이터 12건 (`docs/design/spec.md` §6), 오래된 순 */
export const MOCK_RECORDS: readonly ProcedureRecord[] = [
  { id: "r1", date: "2025.03", title: "셋팅펌" },
  { id: "r2", date: "2025.04", title: "애쉬브라운 염색" },
  { id: "r3", date: "2025.06", title: "단백질 클리닉" },
  { id: "r4", date: "2025.07", title: "뿌리 염색" },
  { id: "r5", date: "2025.09", title: "레이어드 C컬펌" },
  { id: "r6", date: "2025.10", title: "톤다운 컬러" },
  { id: "r7", date: "2025.12", title: "수분 클리닉" },
  { id: "r8", date: "2026.01", title: "볼륨매직" },
  { id: "r9", date: "2026.03", title: "애쉬브라운 리터치" },
  { id: "r10", date: "2026.05", title: "밀크브라운 염색" },
  { id: "r11", date: "2026.07", title: "헤어 클리닉" },
  { id: "r12", date: "2026.09", title: "뿌리 염색" },
];
