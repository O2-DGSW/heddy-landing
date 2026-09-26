import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/** hero: 폰 A/B는 archive 진행도로 수렴한다(`widgets/phone-stage`, TIMELINE.heroArchiveConverge). 이 섹션은 카피만 */
export const HeroSection = () => {
  return (
    <SectionShell
      section="hero"
      heightVh={SECTION_HEIGHT_VH.hero}
      title={COPY.sections.hero.title}
      body={COPY.sections.hero.body}
    />
  );
};
