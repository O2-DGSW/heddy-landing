"use client";

import { useEffect, useRef } from "react";

import Image from "next/image";

import { AR_SCREEN, COPY, PHONE } from "@/shared/config";
import { useSceneFrame, type SceneFrame } from "@/shared/lib/scroll";

import {
  arStyleTarget,
  carouselSlot,
  computeArStyleAt,
  stepStyleClock,
  wrapCarouselOffset,
  type ArStyle,
} from "../model/arScreen";

const { ar } = COPY.phoneScreens;
const ASSET = "/screens/ar";
/** 상태바 아이콘은 추천 화면과 같은 피그마 에셋 */
const STATUS_ASSET = "/screens/recommend";

/** 캐릭터 이미지(스타일 순서) */
const CHARACTER_IMAGES = ["dino-full-bang.webp", "dino-down-perm.webp", "dino-part-dandy.webp"] as const;
/** 캐러셀 항목을 그릴 기준 지름 — 자리마다 크기는 transform scale로 바꾼다 */
const ITEM_BASE = AR_SCREEN.carouselSizes[0];
/** 컨트롤 묶음 아랫변과 카메라 화면 아랫변 사이(피그마 px) */
const CONTROLS_BOTTOM_GAP = 22;
/** 색상 점 묶음(36×221) 중심 y — 화면 위쪽 기준(피그마 px) */
const COLOR_DOTS_CENTER_Y = 349.4;

interface ArScreenProps {
  /** 화면 크기(px). CSS 폰은 `PHONE.screenWidth/Height`, 3D 폰 화면 오버레이는 `PHONE_3D.screen` */
  width?: number;
  height?: number;
}

/**
 * AR 화면 — 피그마 landing / S5-AR화면1·2·3을 HTML로 옮겼다(`docs/plans/0008`). 피그마 px(폭 402)로 짜고
 * 화면 폭에 맞춰 통째로 줄인다. 스크롤이 전환 지점을 넘으면 다음 썸네일에 터치 표시 → 캐러셀이 밀려 선택이
 * 가운데로 → 캐릭터 머리와 스타일 이름이 바뀌는 전환이 시간으로 재생된다(일자 풀뱅 → 다운펌 → 가르마 댄디컷,
 * 팀 피드백 2026-10-14). 프레임마다 ref로만 쓴다.
 */
export const ArScreen = ({ width = PHONE.screenWidth, height = PHONE.screenHeight }: ArScreenProps) => {
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchRef = useRef<HTMLDivElement>(null);
  const { designWidth, statusBar, homeIndicator, imageTop, controlsGap, carousel } = AR_SCREEN;
  const scale = width / designWidth;
  const designHeight = height / scale;

  /** 표시 중인 스타일(0~2) · 목표 · 전환 재생 rAF — 스크롤은 목표만 정하고, 전환은 시간으로 재생한다 */
  const clockRef = useRef({
    shown: 0,
    target: 0,
    lastTime: null as number | null,
    rafId: null as number | null,
  });

  const render = (style: ArStyle) => {
    style.imageWeights.forEach((weight, i) => {
      const node = imageRefs.current[i];
      if (node) node.style.opacity = String(weight);
    });
    style.labelWeights.forEach((weight, i) => {
      const node = labelRefs.current[i];
      if (node) node.style.opacity = String(weight);
    });
    carousel.forEach((_, i) => {
      const node = itemRefs.current[i];
      if (!node) return;
      const slot = carouselSlot(wrapCarouselOffset(i - style.carouselPos, carousel.length));
      node.style.transform = `translateX(${slot.x}px) scale(${slot.size / ITEM_BASE})`;
      node.style.opacity = String(slot.opacity);
      // 선택 테두리(검정)는 가운데에 올수록 진해진다. 그림자는 피그마 0 0 9px rgba(0,0,0,.1)
      node.style.boxShadow = `inset 0 0 0 ${AR_SCREEN.selectedBorder * slot.selected}px #000, 0 0 9px rgba(0,0,0,0.1)`;
    });
    const touch = touchRef.current;
    if (touch) {
      const slot = carouselSlot(
        wrapCarouselOffset(style.touch.carouselIndex - style.carouselPos, carousel.length),
      );
      touch.style.transform = `translateX(${slot.x}px) scale(${slot.size / ITEM_BASE})`;
      touch.style.opacity = String(style.touch.opacity);
    }
  };

  const tick = (time: number) => {
    const clock = clockRef.current;
    clock.rafId = null;
    const dt = clock.lastTime == null ? 16 : Math.min(time - clock.lastTime, 64);
    clock.lastTime = time;
    clock.shown = stepStyleClock(clock.shown, clock.target, dt);
    render(computeArStyleAt(clock.shown));
    if (clock.shown === clock.target) clock.lastTime = null;
    else clock.rafId = requestAnimationFrame(tick);
  };

  useSceneFrame((frame: SceneFrame) => {
    const clock = clockRef.current;
    clock.target = arStyleTarget(frame);
    if (frame.isReducedMotion) {
      clock.shown = clock.target;
      render(computeArStyleAt(clock.shown));
      return;
    }
    if (clock.shown !== clock.target && clock.rafId == null) clock.rafId = requestAnimationFrame(tick);
  });

  useEffect(() => {
    const clock = clockRef.current;
    return () => {
      if (clock.rafId != null) cancelAnimationFrame(clock.rafId);
      clock.rafId = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white"
        style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}
      >
        {/* 카메라 화면: 캐릭터 이미지 3장을 겹쳐 두고 스타일 가중치로 크로스페이드 */}
        <div
          className="absolute left-0 w-full overflow-hidden"
          style={{ top: statusBar, height: designHeight - statusBar - homeIndicator }}
        >
          {CHARACTER_IMAGES.map((src, i) => (
            <div
              key={src}
              ref={(node) => {
                imageRefs.current[i] = node;
              }}
              className="absolute left-0 h-[874px] w-[402px]"
              style={{ top: imageTop - statusBar, opacity: i === 0 ? 1 : 0 }}
            >
              <Image
                src={`${ASSET}/${src}`}
                alt={i === 0 ? ar.styles[0] : ""}
                fill
                loading="eager"
                sizes="560px"
                className="object-cover"
              />
            </div>
          ))}

          {/* 얼굴 인식 중 */}
          <p
            className="absolute left-[293px] rounded-[5px] bg-[#41BE8E] px-[8px] py-[4px] text-[14px] font-medium leading-[1.3] tracking-[-0.02em] text-[#F5F5F5]"
            style={{ top: imageTop + 68 - statusBar }}
          >
            {ar.scanning}
          </p>

          {/* 머리 색상 점 */}
          <Image
            src={`${ASSET}/color-dots.svg`}
            alt=""
            width={36}
            height={221}
            unoptimized
            className="absolute left-[31px] -translate-y-1/2"
            style={{ top: COLOR_DOTS_CENTER_Y - statusBar }}
          />

          {/* 컨트롤: 스타일 이름 줄 → 캐러셀 → 탭 이름 */}
          <div
            className="absolute left-1/2 flex w-[404px] -translate-x-1/2 flex-col items-center"
            style={{ bottom: CONTROLS_BOTTOM_GAP, gap: controlsGap }}
          >
            <div className="flex items-center gap-[8px]">
              <ControlButton icon="bookmark.svg" iconSize={22} />
              <div className="relative h-[36px] w-[213px] overflow-hidden rounded-full bg-white/20 shadow-[0_0_11.5px_rgba(0,0,0,0.07)] backdrop-blur-[1px]">
                {ar.styles.map((label, i) => (
                  <p
                    key={label}
                    ref={(node) => {
                      labelRefs.current[i] = node;
                    }}
                    className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[14px] font-medium leading-[1.3] tracking-[-0.02em] text-[#E6E6E7]"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                  >
                    {label}
                  </p>
                ))}
              </div>
              <ControlButton icon="refresh.svg" iconSize={20.5} />
              <ControlButton icon="resize.svg" iconSize={20.5} />
            </div>

            <div className="relative h-[80px] w-full">
              {carousel.map((item, i) => (
                <div
                  key={item.key}
                  ref={(node) => {
                    itemRefs.current[i] = node;
                  }}
                  className={`absolute left-1/2 top-0 -ml-[40px] size-[80px] overflow-hidden rounded-full ${
                    item.key === "none" ? "bg-[rgba(103,103,103,0.3)] backdrop-blur-[5px]" : "bg-white"
                  }`}
                >
                  {"crop" in item ? (
                    <div
                      className="absolute"
                      style={{
                        left: `${item.crop.left * 100}%`,
                        top: `${item.crop.top * 100}%`,
                        width: `${item.crop.w * 100}%`,
                        height: `${item.crop.h * 100}%`,
                      }}
                    >
                      <Image
                        src={`${ASSET}/thumb-${item.key}.webp`}
                        alt=""
                        fill
                        loading="eager"
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Image
                      src={`${ASSET}/none.svg`}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                  )}
                </div>
              ))}
              {/* 다음 썸네일을 누르는 터치 표시(흰 테두리 원) */}
              <div
                ref={touchRef}
                aria-hidden="true"
                className="absolute left-1/2 top-0 -ml-[40px] size-[80px] rounded-full border-[3px] border-white opacity-0"
              />
            </div>

            <div className="flex items-center gap-[33px] text-center text-[14px] font-medium leading-[1.3] tracking-[-0.02em] text-[#76787A]">
              {ar.tabs.map((tab) => (
                <p key={tab} className="min-w-[35px] whitespace-nowrap">
                  {tab}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* 상태바 */}
        <div className="absolute left-0 top-0 flex h-[54px] w-full items-center bg-white pt-[21px]">
          <p className="flex flex-1 justify-center pl-[16px] pr-[6px] text-[17px] font-semibold leading-[22px] text-black">
            {ar.statusTime}
          </p>
          <div className="w-[124px]" />
          <div className="flex flex-1 items-center justify-center gap-[7px] pl-[6px] pr-[16px]">
            <Image
              src={`${STATUS_ASSET}/status-cellular.svg`}
              alt=""
              width={19.2}
              height={12.2}
              unoptimized
            />
            <Image src={`${STATUS_ASSET}/status-wifi.svg`} alt="" width={17.1} height={12.3} unoptimized />
            <Image src={`${STATUS_ASSET}/status-battery.svg`} alt="" width={27.3} height={13} unoptimized />
          </div>
        </div>

        {/* 홈 인디케이터 */}
        <div className="absolute bottom-0 left-0 h-[34px] w-full bg-white">
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
};

interface ControlButtonProps {
  icon: string;
  iconSize: number;
}

/** 스타일 이름 줄 양옆의 둥근 반투명 버튼(37px) */
const ControlButton = ({ icon, iconSize }: ControlButtonProps) => (
  <div className="flex size-[37px] items-center justify-center rounded-full bg-white/20 shadow-[0_0_8px_rgba(0,0,0,0.07)] backdrop-blur-[1.8px]">
    <Image src={`${ASSET}/${icon}`} alt="" width={iconSize} height={iconSize} unoptimized />
  </div>
);
