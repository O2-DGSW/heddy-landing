"use client";

import { forwardRef, useRef } from "react";

import Image from "next/image";

import { COPY, PHONE, RECOMMEND_SCREEN } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeRecommendScroll } from "../model/recommendScene";

const { recommend } = COPY.phoneScreens;
const ASSET = "/screens/recommend";

/** 하단 탭바 아이콘(피그마 크기 px) — 추천 탭만 활성 */
const TABS = [
  { label: recommend.tabs[0], icon: "tab-home.svg", size: 30 },
  { label: recommend.tabs[1], icon: "tab-record.svg", size: 24 },
  { label: recommend.tabs[2], icon: "tab-ar.svg", size: 35 },
  { label: recommend.tabs[3], icon: "tab-recommend.svg", size: 35, isActive: true },
  { label: recommend.tabs[4], icon: "tab-profile.svg", size: 26 },
] as const;

interface RecommendCardProps {
  index: number;
  className?: string;
}

/**
 * 추천 결과 카드 한 장(피그마 S6-스타일추천, 363×137 px). 화면 속 카드와 폰 밖으로 떠오르는 카드가 같이 쓴다.
 * 바깥 div에 ref를 걸어 떠오르는 자세(transform·그림자)를 프레임마다 쓴다.
 */
export const RecommendCard = forwardRef<HTMLDivElement, RecommendCardProps>(
  ({ index, className = "" }, ref) => {
    const card = recommend.cards[index];
    const crop = RECOMMEND_SCREEN.photoCrops[index];
    return (
      <div
        ref={ref}
        className={`flex h-[137px] w-[363px] items-center justify-center gap-[11px] rounded-[15px] bg-white shadow-[0_0_5px_rgba(0,0,0,0.05)] ${className}`}
      >
        <div
          className="relative size-[117px] shrink-0 overflow-hidden bg-white"
          style={{ borderRadius: crop.radius }}
        >
          <div
            className="absolute"
            style={{ left: crop.left, top: crop.top, width: crop.size, height: crop.size }}
          >
            <Image src={`${ASSET}/photo.webp`} alt={card.style} fill loading="eager" sizes="400px" className="object-cover" />
          </div>
        </div>
        <div className="flex h-[110px] w-[213px] flex-col gap-[6px] leading-[1.3] tracking-[-0.02em]">
          <div className="flex items-center gap-[5px] text-[12px] font-medium">
            <span className="rounded-[5px] border border-[#E6E6E7] bg-[#F5F5F5] px-[8px] py-[2px] text-[#5A5C5D]">
              {card.rank}
            </span>
            <span className="rounded-[5px] bg-[#41BE8E] px-[8px] py-[2px] text-[#F5F5F5]">
              {recommend.basisTag}
            </span>
          </div>
          <div className="flex flex-col gap-[2px] text-[12px] font-medium text-[#5A5C5D]">
            <p className="text-[14px] font-semibold text-[#3C3E3F]">{card.style}</p>
            <p>{card.reason}</p>
            <p>{card.reference}</p>
          </div>
          <div className="flex w-full items-center justify-center gap-[3px] rounded-[15px] border border-[#E6E6E7] bg-[#DADBDC] px-[8px] py-[4px] text-[12px] font-medium text-[#76787A]">
            {recommend.arCta}
            <Image
              src={`${ASSET}/arrow.svg`}
              alt=""
              width={14}
              height={14}
              unoptimized
              className="-scale-x-100"
            />
          </div>
        </div>
      </div>
    );
  },
);
RecommendCard.displayName = "RecommendCard";

interface RecommendScreenProps {
  /** 화면 크기(px). CSS 폰은 `PHONE.screenWidth/Height`, 3D 폰 화면 오버레이는 `PHONE_3D.screen` */
  width?: number;
  height?: number;
}

/**
 * 추천 화면 — 피그마 landing / S6-스타일추천을 HTML로 옮겼다(`docs/plans/0007`). 피그마 px(폭 402)로 짜고
 * 화면 폭에 맞춰 통째로 줄인다. 상단(상태바+제목)·하단(탭바)은 고정, 본문만 페이지 스크롤에 맞춰 올라간다.
 */
export const RecommendScreen = ({
  width = PHONE.screenWidth,
  height = PHONE.screenHeight,
}: RecommendScreenProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const { designWidth, fixedTop, bodyHeight } = RECOMMEND_SCREEN;
  const scale = width / designWidth;
  const designHeight = height / scale;

  useSceneFrame((frame) => {
    if (!bodyRef.current) return;
    const { offsetPx } = computeRecommendScroll(frame, { width, height });
    bodyRef.current.style.transform = `translateY(${-offsetPx}px)`;
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white"
        style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}
      >
        {/* 본문: 추천 결과 Top 3 + 추천 근거 데이터 */}
        <div
          ref={bodyRef}
          className="absolute left-0 w-full bg-[#F7F7F7] will-change-transform"
          style={{ top: fixedTop, height: bodyHeight }}
        >
          <div className="absolute left-[19px] top-[42px] flex w-[363px] flex-col gap-[28px] leading-[1.3] tracking-[-0.02em]">
            <section className="flex flex-col items-end gap-[10px]">
              <h3 className="w-[354px] text-[18px] font-semibold text-[#3C3E3F]">{recommend.topTitle}</h3>
              <div className="flex flex-col gap-[13px]">
                {recommend.cards.map((card, index) => (
                  <RecommendCard key={card.rank} index={index} />
                ))}
              </div>
            </section>
            <section className="flex flex-col items-end gap-[10px]">
              <h3 className="w-[354px] text-[18px] font-semibold text-[#3C3E3F]">{recommend.basisTitle}</h3>
              <dl className="w-[363px] text-[16px] font-medium">
                {recommend.basis.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex h-[53px] items-center justify-between border-b border-[#E6E6E7] px-[14px] last:border-b-0"
                  >
                    <dt className="text-[#999999]">{label}</dt>
                    <dd className="text-[#5A5C5D]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        {/* 상단 고정: 상태바 + 제목 */}
        <div className="absolute left-0 top-0 w-full bg-white" style={{ height: fixedTop }}>
          <div className="flex h-[54px] items-center pt-[21px]">
            <p className="flex flex-1 justify-center pl-[16px] pr-[6px] text-[17px] font-semibold leading-[22px] text-black">
              {recommend.statusTime}
            </p>
            <div className="w-[124px]" />
            <div className="flex flex-1 items-center justify-center gap-[7px] pl-[6px] pr-[16px]">
              <Image src={`${ASSET}/status-cellular.svg`} alt="" width={19.2} height={12.2} unoptimized />
              <Image src={`${ASSET}/status-wifi.svg`} alt="" width={17.1} height={12.3} unoptimized />
              <Image src={`${ASSET}/status-battery.svg`} alt="" width={27.3} height={13} unoptimized />
            </div>
          </div>
          <p className="text-center text-[20px] font-bold leading-[1.3] tracking-[-0.02em] text-[#3C3E3F]">
            {recommend.title}
          </p>
        </div>

        {/* 하단 고정: 탭바(추천 활성) + 홈 인디케이터 */}
        <div className="absolute bottom-0 left-0 h-[106px] w-full overflow-hidden rounded-t-[20px] bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.05)]">
          <div className="absolute left-1/2 top-[calc(50%-8.5px)] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[44px]">
            {TABS.map((tab) => (
              <div key={tab.label} className="flex w-[35px] flex-col items-center gap-[4px]">
                <div className="flex size-[35px] items-center justify-center">
                  <Image src={`${ASSET}/${tab.icon}`} alt="" width={tab.size} height={tab.size} unoptimized />
                </div>
                <p
                  className={`whitespace-nowrap text-center text-[14px] font-medium leading-[1.3] tracking-[-0.02em] ${
                    "isActive" in tab ? "text-[#41BE8E]" : "text-[#C1C2C3]"
                  }`}
                >
                  {tab.label}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
};
