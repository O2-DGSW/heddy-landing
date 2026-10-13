"use client";

import { useRef } from "react";

import Image from "next/image";

import { COPY, PHONE, SHARE_SCREEN } from "@/shared/config";
import { lerp } from "@/shared/lib/motion";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeShareB, computeShareScreen } from "../model/shareScene";

const { shareSettings, shareQr, sharedRecord } = COPY.phoneScreens;
const ASSET = "/screens/share";
/** 상태바 아이콘은 추천 화면과 같은 피그마 에셋 */
const STATUS_ASSET = "/screens/recommend";

/** 토글(30×17.8)의 손잡이 위치(꺼짐 → 켜짐, px) */
const KNOB_LEFT = { off: 1.58, on: 13.89 };
/** 터치 표시 지름(피그마 px) */
const TAP_SIZE = 44;

interface ScreenSizeProps {
  /** 화면 크기(px). CSS 폰은 `PHONE.screenWidth/Height`, 3D 폰 화면 오버레이는 `PHONE_3D.screen` */
  width?: number;
  height?: number;
}

/** 화면 크기를 피그마 px(폭 402)로 옮긴 비율·높이 */
const designOf = (width: number, height: number) => {
  const scale = width / SHARE_SCREEN.designWidth;
  return { scale, designHeight: height / scale };
};

/** 상태바(9:41 · 신호 · 와이파이 · 배터리), 54px */
const StatusBar = () => (
  <div className="flex h-[54px] w-full items-center pt-[21px]">
    <p className="flex flex-1 justify-center pl-[16px] pr-[6px] text-[17px] font-semibold leading-[22px] text-black">
      {shareSettings.statusTime}
    </p>
    <div className="w-[124px]" />
    <div className="flex flex-1 items-center justify-center gap-[7px] pl-[6px] pr-[16px]">
      <Image src={`${STATUS_ASSET}/status-cellular.svg`} alt="" width={19.2} height={12.2} unoptimized />
      <Image src={`${STATUS_ASSET}/status-wifi.svg`} alt="" width={17.1} height={12.3} unoptimized />
      <Image src={`${STATUS_ASSET}/status-battery.svg`} alt="" width={27.3} height={13} unoptimized />
    </div>
  </div>
);

/** 탭바 아이콘(피그마 크기 px) — 기록 탭 활성 */
const TABS = [
  { icon: "tab-home.svg", size: 30 },
  { icon: "tab-record-active.svg", size: 24, isActive: true },
  { icon: "tab-ar.svg", size: 35 },
  { icon: "tab-recommend.svg", size: 35 },
  { icon: "tab-profile.svg", size: 26 },
] as const;

/** 하단 탭바(기록 활성) + 홈 인디케이터, 402×106 */
const RecordTabBar = () => (
  <div className="absolute bottom-0 left-0 h-[106px] w-full overflow-hidden rounded-t-[20px] bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.05)]">
    <div className="absolute left-1/2 top-[calc(50%-8.5px)] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[44px]">
      {TABS.map((tab, i) => (
        <div key={tab.icon} className="flex w-[35px] flex-col items-center gap-[4px]">
          <div
            className={`flex h-[34px] w-[35px] items-center justify-center rounded-[8px] ${
              "isActive" in tab ? "bg-[#41BE8E]" : ""
            }`}
          >
            <Image src={`${ASSET}/${tab.icon}`} alt="" width={tab.size} height={tab.size} unoptimized />
          </div>
          <p
            className={`whitespace-nowrap text-center text-[14px] font-medium leading-[1.3] tracking-[-0.02em] ${
              "isActive" in tab ? "text-[#41BE8E]" : "text-[#C1C2C3]"
            }`}
          >
            {shareSettings.tabs[i]}
          </p>
        </div>
      ))}
    </div>
    <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-black" />
  </div>
);

/**
 * 폰 A 공유 화면 — 피그마 S4-공유화면 → S4-공유QR화면(`docs/plans/0009`). 토글을 하나씩 눌러 켜고, 화면이
 * 내려가 버튼이 드러나면 "공유 링크 생성"을 누르고, 다운펌 상세가 어두워지며 QR 모달이 뜬다.
 * 피그마 px(폭 402)로 짜고 화면 폭에 맞춰 통째로 줄인다. 프레임마다 ref로만 쓴다.
 */
export const ShareScreen = ({ width = PHONE.screenWidth, height = PHONE.screenHeight }: ScreenSizeProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const toggleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const knobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const linkRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<HTMLDivElement>(null);
  const qrViewRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { scale, designHeight } = designOf(width, height);
  const { designWidth, fixedTop, buttons, toggledRows } = SHARE_SCREEN;

  useSceneFrame((frame) => {
    const scene = computeShareScreen(frame, { width, height });
    if (bodyRef.current) bodyRef.current.style.transform = `translateY(${-scene.scrollPx}px)`;
    scene.toggles.forEach((on, i) => {
      const track = toggleRefs.current[i];
      const knob = knobRefs.current[i];
      // 꺼짐 회색 #C1C2C3 → 켜짐 초록 #41BE8E
      if (track) {
        track.style.backgroundColor = `rgb(${lerp(193, 65, on)}, ${lerp(194, 190, on)}, ${lerp(195, 142, on)})`;
      }
      if (knob) knob.style.left = `${lerp(KNOB_LEFT.off, KNOB_LEFT.on, on)}px`;
    });
    if (linkRef.current) linkRef.current.style.transform = `scale(${1 - 0.04 * scene.linkPress})`;
    const tap = tapRef.current;
    if (tap) {
      tap.style.transform = `translate(${scene.tap.x - TAP_SIZE / 2}px, ${scene.tap.y - TAP_SIZE / 2}px) scale(${lerp(0.6, 1.4, scene.tap.ripple)})`;
      tap.style.opacity = String(0.18 * scene.tap.press);
    }
    if (qrViewRef.current) {
      qrViewRef.current.style.opacity = String(scene.qr.bg);
      qrViewRef.current.style.visibility = scene.qr.bg > 0 ? "visible" : "hidden";
    }
    if (modalRef.current) {
      modalRef.current.style.opacity = String(scene.qr.modal);
      modalRef.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.9, 1, scene.qr.modal)})`;
    }
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden bg-white leading-[1.3] tracking-[-0.02em]"
        style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}
      >
        {/* ── 기록 공유(토글) ── */}
        <div
          ref={bodyRef}
          className="absolute left-0 h-[736px] w-full bg-[#F7F7F7] will-change-transform"
          style={{ top: fixedTop }}
        >
          <div className="absolute left-[19px] top-[29px] flex w-[363px] flex-col items-end gap-[10px]">
            <p className="w-[354px] text-[18px] font-semibold text-[#3C3E3F]">{shareSettings.sectionTitle}</p>
            <div className="w-[363px]">
              {shareSettings.rows.map((label, row) => {
                const toggleIndex = toggledRows.indexOf(row as (typeof toggledRows)[number]);
                return (
                  <div
                    key={label}
                    className="flex h-[53px] items-center justify-between border-b border-[#E6E6E7] pl-[14px] pr-[13px] last:border-b-0"
                  >
                    <p className="whitespace-nowrap text-[16px] font-medium text-[#999999]">{label}</p>
                    <div
                      ref={(node) => {
                        if (toggleIndex >= 0) toggleRefs.current[toggleIndex] = node;
                      }}
                      className="relative h-[17.8px] w-[30px] overflow-hidden rounded-[14px] bg-[#C1C2C3]"
                    >
                      <div
                        ref={(node) => {
                          if (toggleIndex >= 0) knobRefs.current[toggleIndex] = node;
                        }}
                        className="absolute top-1/2 size-[14.2px] -translate-y-1/2 rounded-full bg-[#F2F2F2]"
                        style={{ left: KNOB_LEFT.off }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="absolute left-[19px] flex gap-[7px]" style={{ top: buttons.top }}>
            <div className="flex h-[42px] w-[178px] items-center justify-center rounded-[10px] border border-[#E6E6E7] bg-[#FAFAFA] text-[18px] font-semibold text-[#5A5C5D]">
              {shareSettings.cancel}
            </div>
            <div
              ref={linkRef}
              className="flex h-[42px] w-[178px] items-center justify-center rounded-[10px] bg-[#41BE8E] text-[18px] font-semibold text-[#F5F5F5]"
            >
              {shareSettings.createLink}
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 w-full bg-white" style={{ height: fixedTop }}>
          <StatusBar />
          <div className="absolute left-[30px] top-[70px] flex items-center gap-[120px]">
            <Image src={`${ASSET}/back.svg`} alt="" width={20} height={20} unoptimized />
            <p className="text-[20px] font-bold text-[#3C3E3F]">{shareSettings.title}</p>
          </div>
        </div>
        <RecordTabBar />

        {/* 누르는 자리 표시 */}
        <div
          ref={tapRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 size-[44px] rounded-full bg-neutral-900 opacity-0"
        />

        {/* ── 다운펌 상세 + QR 모달 ── */}
        <div ref={qrViewRef} className="invisible absolute inset-0 bg-white opacity-0">
          <StatusBar />
          <div className="absolute left-[24px] top-[54px] flex w-[354px] items-center gap-[129px]">
            <Image src={`${ASSET}/back.svg`} alt="" width={20} height={20} unoptimized />
            <p className="text-[20px] font-bold text-[#3C3E3F]">{shareQr.title}</p>
          </div>
          <div className="absolute left-0 top-[90px] flex h-[59px] w-full items-center justify-center gap-[132px] border-b border-[#E6E6E7]">
            <p className="text-[18px] font-semibold text-[#3C3E3F]">{shareQr.tabs[0]}</p>
            <p className="text-[16px] font-medium text-[#C1C2C3]">{shareQr.tabs[1]}</p>
            <div className="absolute bottom-[-1.5px] left-[calc(50%-123px)] h-[3px] w-[56px] bg-[#3C3E3F]" />
          </div>
          <div className="absolute left-[19px] top-[178px] flex w-[363px] flex-col gap-[52px]">
            <div className="flex flex-col gap-[6px]">
              <p className="pl-[8px] text-[18px] font-semibold text-[#3C3E3F]">{shareQr.photoTitle}</p>
              <div className="flex gap-[11px] pl-[6px]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative size-[110px] overflow-hidden rounded-[10px]">
                    <Image
                      src={`${ASSET}/photo.webp`}
                      alt=""
                      fill
                      loading="eager"
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-[10px]">
              <p className="w-[354px] text-[18px] font-semibold text-[#3C3E3F]">{shareQr.infoTitle}</p>
              <div className="w-[363px] rounded-[15px] bg-white">
                {shareQr.info.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex h-[53px] items-center justify-between border-b border-[#F5F5F5] px-[14px] text-[16px] font-medium"
                  >
                    <p className="text-[#999999]">{label}</p>
                    <p className="text-[#5A5C5D]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <RecordTabBar />
          {/* 어두운 막 + 공유 모달 */}
          <div className="absolute inset-0 bg-black/50" />
          <div
            ref={modalRef}
            className="absolute left-1/2 top-1/2 h-[408px] w-[290px] overflow-hidden rounded-[10px] bg-white opacity-0"
          >
            <div className="absolute left-[14px] top-[16px] flex w-[263px] flex-col gap-[33px]">
              <div className="flex items-start justify-between">
                <p className="text-[18px] font-semibold text-[#3C3E3F]">{shareQr.modalTitle}</p>
                <div className="flex size-[28px] items-center justify-center rounded-full bg-[#F7F7F7]">
                  <Image src={`${ASSET}/close.svg`} alt="" width={10} height={10} unoptimized />
                </div>
              </div>
              <div className="flex flex-col items-center gap-[39px]">
                <div className="relative size-[189px]">
                  <Image
                    src={`${ASSET}/qr.png`}
                    alt="공유 QR"
                    fill
                    loading="eager"
                    sizes="240px"
                    className="object-contain"
                  />
                </div>
                <div className="relative h-[70px] w-full">
                  <p className="absolute left-[4px] top-0 text-[14px] font-medium text-[#76787A]">
                    {shareQr.linkLabel}
                  </p>
                  <div className="absolute left-0 top-[25px] flex h-[45px] w-[210px] items-center justify-center gap-[15px] rounded-[10px] bg-[#F7F7F7]">
                    <p className="text-[14px] font-semibold text-[#5A5C5D]">{shareQr.link}</p>
                    <Image src={`${ASSET}/copy.svg`} alt="" width={23} height={23} unoptimized />
                  </div>
                  <div className="absolute left-[218px] top-[25px] flex size-[45px] items-center justify-center rounded-full bg-[#F7F7F7]">
                    <Image src={`${ASSET}/share.svg`} alt="" width={19} height={19} unoptimized />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 폰 B 스캔 화면 — 초록 모서리 틀 안에서 스캔 선이 위아래로 오간다(레퍼런스 영상 1). 피그마에 없어 영상대로 그렸다.
 * 스캔 선은 시간 애니메이션이고, 모션 줄이기 설정이면 멈춘다.
 */
export const ScanScreen = ({ width = PHONE.screenWidth, height = PHONE.screenHeight }: ScreenSizeProps) => {
  const { scale, designHeight } = designOf(width, height);
  const { scanFrame } = SHARE_SCREEN;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F5F5F5]">
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: SHARE_SCREEN.designWidth, height: designHeight, transform: `scale(${scale})` }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            top: designHeight * scanFrame.centerYRatio,
            width: scanFrame.size,
            height: scanFrame.size,
          }}
        >
          {(
            [
              "left-0 top-0 border-l-4 border-t-4 rounded-tl-[14px]",
              "right-0 top-0 border-r-4 border-t-4 rounded-tr-[14px]",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[14px]",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-[14px]",
            ] as const
          ).map((corner) => (
            <div key={corner} className={`absolute size-[50px] border-[#41BE8E] ${corner}`} />
          ))}
          <div className="absolute inset-x-[16px] top-[20px] h-[3px] animate-[scan-line_1.6s_ease-in-out_infinite_alternate] rounded-full bg-[#41BE8E] shadow-[0_0_10px_rgba(65,190,142,0.6)] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
};

/**
 * 폰 B 공유된 시술기록 화면 — 피그마 S3-시술기록 공유. QR이 도착하면 열리고 초록 체크 표시가 커지며 떴다가
 * 사라진다(`docs/plans/0009`).
 */
export const SharedRecordScreen = ({
  width = PHONE.screenWidth,
  height = PHONE.screenHeight,
}: ScreenSizeProps) => {
  const checkRef = useRef<HTMLDivElement>(null);
  const { scale, designHeight } = designOf(width, height);

  useSceneFrame((frame) => {
    const { check } = computeShareB(frame);
    if (checkRef.current) {
      checkRef.current.style.opacity = String(check.opacity);
      checkRef.current.style.transform = `translate(-50%, -50%) scale(${check.scale})`;
    }
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="absolute left-0 top-0 origin-top-left bg-white leading-[1.3] tracking-[-0.02em]"
        style={{ width: SHARE_SCREEN.designWidth, height: designHeight, transform: `scale(${scale})` }}
      >
        <StatusBar />
        <div className="absolute left-0 top-[54px] flex w-full flex-col items-center">
          <p className="text-[20px] font-bold text-[#3C3E3F]">{sharedRecord.title}</p>
          <p className="text-[12px] text-[#797A7C]">{sharedRecord.sharedBy}</p>
        </div>
        <div className="absolute left-0 top-[115px] h-px w-full bg-[#E6E6E7]" />
        <p className="absolute left-[10px] top-[143px] text-[18px] font-bold text-[#3C3E3F]">
          {sharedRecord.photoTitle}
        </p>
        <div className="absolute left-[16px] top-[173px] size-[110px] overflow-hidden rounded-[10px]">
          <Image
            src={`${ASSET}/photo.webp`}
            alt=""
            fill
            loading="eager"
            sizes="160px"
            className="object-cover"
          />
        </div>
        <p className="absolute left-[10px] top-[335px] text-[18px] font-bold text-[#3C3E3F]">
          {sharedRecord.infoTitle}
        </p>
        <div className="absolute left-[10px] top-[369px] w-[392px] text-[16px] font-semibold">
          {sharedRecord.info.map(({ label, value }) => (
            <div
              key={label}
              className="flex h-[53px] items-center justify-between border-b border-[#F0F0F0] pl-[14px] pr-[16px]"
            >
              <p className="text-[#76787A]">{label}</p>
              <p className="text-[#5A5C5D]">{value}</p>
            </div>
          ))}
          <div className="flex h-[53px] items-center justify-between pl-[14px] pr-[16px]">
            <p className="text-[#76787A]">{sharedRecord.ratingLabel}</p>
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Image
                  key={i}
                  src={`${ASSET}/star.svg`}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="-mr-[3px] last:mr-0"
                />
              ))}
            </div>
          </div>
        </div>
        <p className="absolute left-0 top-[663px] w-full text-center text-[12px] text-[#797A7C]">
          {sharedRecord.expiry}
        </p>
        <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-black" />

        {/* 전달 완료 체크 */}
        <div
          ref={checkRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[44%] flex size-[96px] items-center justify-center rounded-full bg-[#41BE8E] opacity-0 shadow-[0_8px_24px_rgba(65,190,142,0.45)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-[44px]"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};
