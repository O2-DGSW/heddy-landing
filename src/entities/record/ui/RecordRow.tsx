import type { ProcedureRecord } from "../model/types";

export interface RecordRowProps {
  record: ProcedureRecord;
  isFocused?: boolean;
}

/** 기록 한 줄(날짜 + 제목). 포커스 여부에 따른 스타일은 부모(phone-stage)가 transform/opacity로 얹는다 */
export const RecordRow = ({ record, isFocused = false }: RecordRowProps) => {
  return (
    <div
      className="flex items-baseline justify-between"
      aria-current={isFocused ? "true" : undefined}
    >
      <span className="text-16 font-medium">{record.title}</span>
      <span className="text-14">{record.date}</span>
    </div>
  );
};
