import { Footer } from "@/widgets/footer";
import { FullpageNavigation } from "@/widgets/fullpage-navigation";
import { Header } from "@/widgets/header";
import { Intro } from "@/widgets/intro";
import { MobileLanding } from "@/widgets/mobile-landing";
import { PhoneStage } from "@/widgets/phone-stage";
import { ArSection } from "@/widgets/section-ar";
import { ClosingSection } from "@/widgets/section-closing";
import { RecommendSection } from "@/widgets/section-recommend";
import { RecordSection } from "@/widgets/section-record";
import { ReportSection } from "@/widgets/section-report";
import { ShareSection } from "@/widgets/section-share";
import { INTRO_SECTION_MIN_PX, SECTION_HEIGHT_VH, TIMELINE } from "@/shared/config";

const INTRO_HEIGHT = `max(${SECTION_HEIGHT_VH.intro}vh, calc(${INTRO_SECTION_MIN_PX}px + ${-TIMELINE.stageRevealVh[0] * 100}vh))`;

/**
 * 섹션 순서는 `shared/config/sections`의 SECTION_KEYS와 항상 같아야 한다.
 * 데스크톱(lg 이상)은 고정 3D 폰 + 스크롤 섹션, 모바일은 섹션을 쌓는 `MobileLanding`(이슈 #52) — 같은 순서·문구.
 */
export const LandingPage = () => {
  return (
    <>
      <Header />
      <div className="hidden lg:block">
        <section data-section="intro" className="relative" style={{ height: INTRO_HEIGHT }}>
          <div className="sticky top-0 h-svh">
            <Intro />
          </div>
        </section>
        <RecordSection />
        <ReportSection />
        <RecommendSection />
        <ArSection />
        <ShareSection />
        <ClosingSection />
      </div>
      <MobileLanding intro={<Intro className="aspect-video" />} />
      <Footer />
      <PhoneStage />
      <FullpageNavigation />
    </>
  );
};
