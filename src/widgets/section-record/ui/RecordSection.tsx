import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/**
 * TODO(docs/plans/0001, TIMELINE.record.band): 좌측 레일 + "핀 진행 %" + 큰 날짜 색 보간 +
 * 포커스 밴드(12행, 가운데만 선명). 지금은 카피만.
 */
export const RecordSection = () => {
  return (
    <SectionShell
      section="record"
      heightVh={SECTION_HEIGHT_VH.record}
      eyebrow={COPY.sections.record.eyebrow}
      title={COPY.sections.record.title}
      body={COPY.sections.record.body}
    />
  );
};
