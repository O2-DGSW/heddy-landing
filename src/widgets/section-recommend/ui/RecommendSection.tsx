import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/** 카피만 둔다. 폰 화면·추천 카드 팝아웃 모션은 phone-stage가 맡는다(`docs/plans/0007`) */
export const RecommendSection = () => {
  return (
    <SectionShell
      section="recommend"
      heightVh={SECTION_HEIGHT_VH.recommend}
      title={COPY.sections.recommend.title}
    />
  );
};
