import { computeRecordSteps, type ProcedureRecord } from "@/entities/record";
import { clamp, mixRgb, type RgbColor } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

/** 큰 날짜 색: 첫 기록(연한 베이지 회색) → 마지막 기록(거의 검정) (`docs/design/spec.md` §5) */
const DATE_COLOR_FROM: RgbColor = [214, 208, 196];
const DATE_COLOR_TO: RgbColor = [13, 13, 13];

export type RecordAside = {
  /** 좌측 레일 scaleY */
  railScale: number;
  /** 지금 포커스된(가장 최근에 추가되는) 기록의 연·월과 그 직전 기록의 연·월 */
  date: string;
  prevDate: string | null;
  /** 직전 날짜 → 현재 날짜로 굴러 올라가는 진행도(0~1). 폰 카드 등장과 같은 값 */
  roll: number;
  dateColor: RgbColor;
};

/** record 섹션 좌측(레일·큰 날짜). 폰 카드 스택과 같은 스텝(`computeRecordSteps`)을 쓴다 */
export const computeRecordAside = (frame: SceneFrame, records: readonly ProcedureRecord[]): RecordAside => {
  const p = frame.isReducedMotion ? 1 : frame.progress("record");
  const steps = computeRecordSteps(frame, records.length);
  const index = steps.focusIndex;
  const colorT = clamp((steps.raw - 1) / Math.max(records.length - 1, 1));

  return {
    railScale: 0.08 + 0.92 * p,
    date: records[index].date,
    prevDate: index > 0 ? records[index - 1].date : null,
    roll: index > 0 ? steps.entered[index] : 1,
    dateColor: mixRgb(DATE_COLOR_FROM, DATE_COLOR_TO, colorT),
  };
};
