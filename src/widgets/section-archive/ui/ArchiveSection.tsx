import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/** archive: 폰 A/B 수렴·B 페이드아웃은 `widgets/phone-stage`가 담당(TIMELINE.heroArchiveConverge/archiveBFade) */
export const ArchiveSection = () => {
  return (
    <SectionShell
      section="archive"
      heightVh={SECTION_HEIGHT_VH.archive}
      title={COPY.sections.archive.title}
      body={COPY.sections.archive.body}
    />
  );
};
