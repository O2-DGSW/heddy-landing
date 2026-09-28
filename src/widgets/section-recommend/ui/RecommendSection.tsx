import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/** TODO(docs/plans/0001, TIMELINE.recommend): 기록 3건 → 추천 선 드로잉(strokeDashoffset). 지금은 카피만 */
export const RecommendSection = () => {
  return (
    <SectionShell
      section="recommend"
      heightVh={SECTION_HEIGHT_VH.recommend}
      title={COPY.sections.recommend.title}
    />
  );
};
