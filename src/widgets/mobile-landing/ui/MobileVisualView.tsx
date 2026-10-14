import type { CSSProperties } from "react";

import Image from "next/image";

import type { MobileVisual } from "../model/mobileSections";
import { phoneRisePercent } from "../model/phoneRise";
import { RecommendCarousel } from "./RecommendCarousel";

const PHONE_RISE_PERCENT = phoneRisePercent();

/**
 * 평면 폰 목업(직접 그린 SVG, 상표 요소 없음). 446×906 안에 화면 402×874가 (22, 16)에서 반지름 55로 뚫려 있다
 * — 화면 자리 클래스는 이 값을 백분율로 옮긴 것(22/446, 16/906, 402/446, 874/906, 55/402 · 55/874)
 */
const FRAME_SRC = "/screens/mobile/phone-frame.svg";

interface PhoneMockupProps {
  src: string;
  alt: string;
  /** 첫 화면(히어로)은 바로 받는다 */
  isPriority?: boolean;
  className?: string;
}

/** 평면 폰 목업 한 대 — 화면 이미지 위에 목업 테두리를 겹친다 */
const PhoneMockup = ({ src, alt, isPriority = false, className = "" }: PhoneMockupProps) => (
  <div className={`relative aspect-[446/906] drop-shadow-[0_24px_32px_rgba(0,0,0,0.18)] ${className}`}>
    <div className="absolute left-[4.933%] top-[1.766%] h-[96.468%] w-[90.135%] overflow-hidden rounded-[13.682%/6.293%] bg-white">
      <Image
        src={src}
        alt={alt}
        fill
        priority={isPriority}
        sizes="(max-width: 640px) 62vw, 400px"
        className="object-cover object-top"
      />
    </div>
    <Image src={FRAME_SRC} alt="" fill unoptimized priority={isPriority} className="pointer-events-none" />
  </div>
);

interface MobileVisualViewProps {
  visual: MobileVisual;
  tone: "light" | "dark";
}

/**
 * 섹션 화면(이슈 #52) — toss.im 모바일처럼 회색 둥근 카드 안에 평면 폰 목업을 둔다. 목업은 카드 아래로 잘려
 * 윗부분만 보인다. 히어로는 카드 없이 목업 두 대를 V자로 기울인다.
 */
export const MobileVisualView = ({ visual, tone }: MobileVisualViewProps) => {
  if (visual.kind === "carousel") return <RecommendCarousel />;

  if (visual.kind === "pair" && visual.isTilted) {
    return (
      <div className="relative flex aspect-[1/0.92] items-end justify-center">
        <PhoneMockup {...visual.left} isPriority className="w-[46%] translate-x-[8%] -rotate-[8deg]" />
        <PhoneMockup {...visual.right} isPriority className="w-[46%] -translate-x-[8%] rotate-[8deg]" />
      </div>
    );
  }

  // overflow-clip: hidden은 스크롤 컨테이너가 되어 안쪽 스크롤 연동 애니메이션(view())의 기준이 카드로 잡힌다.
  // min-h-0: clip이면 비율 상자가 내용(목업) 높이만큼 늘어나 목업이 잘리지 않으므로 비율을 고정한다
  const cardClassName = `relative aspect-[1/1.08] min-h-0 overflow-clip rounded-[28px] ${
    tone === "dark" ? "bg-[#1A1A1A]" : "bg-[#F4F4F5]"
  }`;

  if (visual.kind === "pair") {
    return (
      <div className={`${cardClassName} flex items-start justify-center gap-[3%] px-[5%] pt-[9%]`}>
        <PhoneMockup {...visual.left} className="w-[45%] shrink-0" />
        <PhoneMockup {...visual.right} className="mt-[8%] w-[45%] shrink-0" />
      </div>
    );
  }

  // 카드 아래로 잘린 목업이 스크롤하면 올라와 아랫부분까지 보인다(`MOBILE_CARD`와 같은 비율)
  return (
    <div className={`${cardClassName} pt-[9%]`}>
      <div className="scroll-rise" style={{ "--rise": `${PHONE_RISE_PERCENT}%` } as CSSProperties}>
        <PhoneMockup src={visual.src} alt={visual.alt} className="mx-auto w-[64%]" />
      </div>
    </div>
  );
};
