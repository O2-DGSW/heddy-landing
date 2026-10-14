import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { MobileLanding } from "@/widgets/mobile-landing";
import { PhoneStage } from "@/widgets/phone-stage";
import { ArSection } from "@/widgets/section-ar";
import { ArchiveSection } from "@/widgets/section-archive";
import { ClosingSection } from "@/widgets/section-closing";
import { HeroSection } from "@/widgets/section-hero";
import { RecommendSection } from "@/widgets/section-recommend";
import { RecordSection } from "@/widgets/section-record";
import { ReportSection } from "@/widgets/section-report";
import { ShareSection } from "@/widgets/section-share";

/**
 * 섹션 순서는 `shared/config/sections`의 SECTION_KEYS와 항상 같아야 한다.
 * 데스크톱(lg 이상)은 고정 3D 폰 + 스크롤 섹션, 모바일은 섹션을 쌓는 `MobileLanding`(이슈 #52) — 같은 순서·문구.
 */
export const LandingPage = () => {
  return (
    <>
      <Header />
      <div className="hidden lg:block">
        <HeroSection />
        <ArchiveSection />
        <RecordSection />
        <ReportSection />
        <RecommendSection />
        <ArSection />
        <ShareSection />
        <ClosingSection />
      </div>
      <MobileLanding />
      <Footer />
      <PhoneStage />
    </>
  );
};
