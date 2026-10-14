import Image from "next/image";

import { PHONE_3D } from "@/shared/config";

import type { MobileVisual } from "../model/mobileSections";

interface PhoneShotProps {
  src: string;
  alt: string;
  className?: string;
}

/** 폰 한 대(얇은 베젤 + 화면 이미지). 카드 아래로 잘려 윗부분만 보인다 */
const PhoneShot = ({ src, alt, className = "" }: PhoneShotProps) => (
  <div
    className={`relative aspect-[402/874] overflow-hidden rounded-[38px] border-[6px] border-[#1C1E20] bg-[#1C1E20] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] ${className}`}
  >
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 62vw, 400px"
      className="rounded-[32px] object-cover object-top"
    />
  </div>
);

interface MobileVisualViewProps {
  visual: MobileVisual;
  tone: "light" | "dark";
}

/**
 * 섹션 화면(이슈 #52) — toss.im 모바일처럼 회색 둥근 카드 안에 폰 화면을 둔다. 폰은 카드 아래로 잘려
 * 윗부분만 보이고, 히어로는 카드 없이 3D 첫 화면 이미지(폰 두 대)를 그대로 쓴다.
 */
export const MobileVisualView = ({ visual, tone }: MobileVisualViewProps) => {
  if (visual.kind === "hero") {
    return (
      <div className="relative aspect-[1242/1048] w-full">
        <Image
          src={PHONE_3D.posterImage.src}
          alt="헤디 앱 화면 두 개"
          fill
          priority
          sizes={PHONE_3D.posterImage.sizes}
          className="object-contain"
        />
      </div>
    );
  }

  const cardClassName = `relative aspect-[1/1.08] overflow-hidden rounded-[28px] ${
    tone === "dark" ? "bg-[#1A1A1A]" : "bg-[#F4F4F5]"
  }`;

  if (visual.kind === "pair") {
    return (
      <div className={`${cardClassName} flex justify-center gap-[4%] px-[5%] pt-[9%]`}>
        <PhoneShot {...visual.left} className="w-[44%] shrink-0" />
        <PhoneShot {...visual.right} className="mt-[8%] w-[44%] shrink-0" />
      </div>
    );
  }

  return (
    <div className={`${cardClassName} pt-[10%]`}>
      <PhoneShot src={visual.src} alt={visual.alt} className="mx-auto w-[62%]" />
    </div>
  );
};
