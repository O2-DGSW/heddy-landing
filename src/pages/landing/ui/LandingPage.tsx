import { Header } from "@/widgets/header";
import { PhoneStage } from "@/widgets/phone-stage";
import { ArSection } from "@/widgets/section-ar";
import { ArchiveSection } from "@/widgets/section-archive";
import { ClosingSection } from "@/widgets/section-closing";
import { HeroSection } from "@/widgets/section-hero";
import { RecommendSection } from "@/widgets/section-recommend";
import { RecordSection } from "@/widgets/section-record";
import { ReportSection } from "@/widgets/section-report";
import { ShareSection } from "@/widgets/section-share";

/** 섹션 순서는 `shared/config/sections`의 SECTION_KEYS와 항상 같아야 한다 */
export const LandingPage = () => {
  return (
    <>
      <Header />
      <HeroSection />
      <ArchiveSection />
      <RecordSection />
      <ReportSection />
      <RecommendSection />
      <ArSection />
      <ShareSection />
      <ClosingSection />
      <PhoneStage />
    </>
  );
};
