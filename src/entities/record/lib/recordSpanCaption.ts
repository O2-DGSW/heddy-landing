import type { ProcedureRecord } from "../model/types";

const parseYearMonth = (date: string): { year: number; month: number } => {
  const [year, month] = date.split(".").map(Number);
  return { year, month };
};

/**
 * 포커스된 기록 캡션. 첫 기록이면 "첫 기록", 아니면 "기록 N건 · Y년 M개월"
 * (N = 지금까지 쌓인 기록 수, Y/M = 첫 기록부터의 경과 기간)
 */
export const recordSpanCaption = (
  records: readonly ProcedureRecord[],
  focusIndex: number,
): string => {
  if (focusIndex <= 0) return "첫 기록";

  const first = parseYearMonth(records[0].date);
  const focused = parseYearMonth(records[focusIndex].date);
  const totalMonths =
    (focused.year - first.year) * 12 + (focused.month - first.month);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return `기록 ${focusIndex + 1}건 · ${years}년 ${months}개월`;
};
