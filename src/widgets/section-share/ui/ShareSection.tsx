import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/**
 * TODO(docs/plans/0001, TIMELINE.share): QR clip-path 생성 → 미용실 폰 슬라이드 인 →
 * QR 포물선 비행(`widgets/phone-stage`) → 웹뷰. 지금은 카피만.
 */
export const ShareSection = () => {
  return (
    <SectionShell
      section="share"
      heightVh={SECTION_HEIGHT_VH.share}
      title={COPY.sections.share.title}
      body={[COPY.sections.share.body]}
    />
  );
};
