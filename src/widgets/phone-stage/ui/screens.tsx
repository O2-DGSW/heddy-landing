"use client";

import { useRef } from "react";

import Image from "next/image";

import { RECORD_CARDS } from "@/entities/record";
import { COPY, DETAIL_SCREEN, PHONE, RECORD_STACK } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeDetailBars, computeDetailScroll } from "../model/detailScroll";
import { computeSettledRecordCards } from "../model/recordStack";

/** 홈 화면 — 실제 앱 홈 화면 캡처 (`docs/design/spec.md` §4) */
export const HomeScreen = () => (
  <Image src="/screens/home.png" alt="헤디 홈 화면" fill priority sizes="280px" className="object-cover" />
);

/** record 끝에서 3D 폰이 넘겨주는 카드 배치(12건이 다 쌓이고 내려앉은 상태) */
const SETTLED_RECORD_CARDS = computeSettledRecordCards(RECORD_CARDS.length);

const toPercent = (value: number, total: number): string => `${(value / total) * 100}%`;

/**
 * 기록 화면 — 실제 앱 기록 화면에서 카드를 비운 바탕 + 카드 이미지(최신이 맨 위).
 * 3D 기록 스택의 마지막 상태와 같은 배치라 넘겨받을 때 이음새가 없다(`docs/plans/0004`).
 */
export const RecordScreen = () => {
  const { screen, card } = RECORD_STACK;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src="/screens/record/base.png"
        alt="헤디 시술기록 화면"
        fill
        sizes="280px"
        className="object-fill"
      />
      {SETTLED_RECORD_CARDS.map((pose, index) => {
        if (!pose.isVisible) return null;
        // 3D와 같은 윗변에 원래 크기로 두고, 네비 뒤로 들어간 부분은 네비와 overflow가 가린다
        const top = pose.y - (card.height * pose.scaleY) / 2;
        return (
          <div
            key={RECORD_CARDS[index].id}
            className="absolute"
            style={{
              left: toPercent(pose.x - card.width / 2, screen.width),
              top: toPercent(top, screen.height),
              width: toPercent(card.width, screen.width),
              height: toPercent(card.height, screen.height),
            }}
          >
            <Image
              src={`/screens/record/card-${String(index + 1).padStart(2, "0")}.png`}
              alt={`${RECORD_CARDS[index].date} ${RECORD_CARDS[index].title}`}
              fill
              sizes="250px"
              className="object-fill"
            />
          </div>
        );
      })}
      <Image
        src="/screens/record/nav.png"
        alt=""
        width={1608}
        height={456}
        sizes="280px"
        className="absolute bottom-0 left-0 w-full"
      />
      <Image
        src="/screens/record/fab.png"
        alt=""
        width={40}
        height={40}
        className="absolute left-[80.5%] top-[80.3%] h-[6.9%] w-auto"
      />
    </div>
  );
};

interface DetailScreenProps {
  /** 화면 크기(px). CSS 폰은 `PHONE.screenWidth/Height`, 3D 폰 화면 오버레이는 `PHONE_3D.screen` */
  width?: number;
  height?: number;
}

/**
 * 리포트 구간 화면 — 다운펌 분석완료 상세(`docs/plans/0005`). 상단(상태바+앱바)·하단(탭바)은 고정하고
 * 본문만 페이지 스크롤에 맞춰 폰 안에서 올라간다. 프레임마다 ref로 transform만 쓴다.
 */
export const DetailScreen = ({
  width = PHONE.screenWidth,
  height = PHONE.screenHeight,
}: DetailScreenProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scale = width / DETAIL_SCREEN.imageWidthPx;
  const screen = { width, height };
  const { bars, imageWidthPx, bodyHeightPx } = DETAIL_SCREEN;
  /** 이미지 속 막대의 안티앨리어싱 테두리까지 덮도록 사방으로 넓히는 여유(이미지 px) */
  const barCoverPad = 3;

  useSceneFrame((frame) => {
    if (!bodyRef.current) return;
    const { offsetPx } = computeDetailScroll(frame, screen);
    bodyRef.current.style.transform = `translateY(${-offsetPx}px)`;
    computeDetailBars(frame).forEach((fill, i) => {
      const bar = barRefs.current[i];
      if (bar) bar.style.transform = `scaleX(${fill})`;
    });
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F7F7F7]">
      <div
        ref={bodyRef}
        className="absolute left-0 w-full will-change-transform"
        style={{ top: DETAIL_SCREEN.fixedTopPx * scale, height: DETAIL_SCREEN.bodyHeightPx * scale }}
      >
        <Image src="/screens/detail/body.png" alt="다운펌 분석 결과" fill loading="eager" sizes="280px" className="object-cover" />
        {/* 상태 지표 막대: 이미지 속 막대를 같은 자리에서 덮고, 섹션 카피 막대와 같이 점수만큼 채운다 */}
        {bars.centerY.map((centerY, i) => (
          <div
            key={centerY}
            aria-hidden="true"
            className="absolute bg-[#F7F7F7]"
            style={{
              left: `${((bars.x - barCoverPad) / imageWidthPx) * 100}%`,
              width: `${((bars.width + barCoverPad * 2) / imageWidthPx) * 100}%`,
              top: `${((centerY - bars.height / 2 - barCoverPad) / bodyHeightPx) * 100}%`,
              height: `${((bars.height + barCoverPad * 2) / bodyHeightPx) * 100}%`,
              padding: barCoverPad * scale,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-full bg-[#E7E7E7]">
              <div
                ref={(node) => {
                  barRefs.current[i] = node;
                }}
                className="h-full w-full origin-left rounded-full bg-[#41BD91]"
                // Tailwind scale-x-*는 별도 `scale` 속성이라 ref로 쓰는 transform과 곱해진다 → 초기값도 transform으로
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-0 top-0 w-full" style={{ height: DETAIL_SCREEN.fixedTopPx * scale }}>
        <Image src="/screens/detail/top.png" alt="" fill loading="eager" sizes="280px" className="object-cover" />
      </div>
      <div className="absolute bottom-0 left-0 w-full" style={{ height: DETAIL_SCREEN.fixedBottomPx * scale }}>
        <Image src="/screens/detail/bottom.png" alt="" fill loading="eager" sizes="280px" className="object-cover" />
      </div>
    </div>
  );
};

/** AR 화면 — 실제 앱 AR 체험 화면 캡처. pill 분할/다크 패널 전환 모션은 TODO(docs/plans/0001) */
export const ArScreen = () => (
  <Image src="/screens/ar.webp" alt="헤디 AR 스타일 체험 화면" fill sizes="280px" className="object-cover" />
);

/** QR 공유 화면: clip-path 모션은 TODO(docs/plans/0001) */
export const QrShareScreen = () => {
  const { qrShare } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-14 font-medium">{qrShare.title}</p>
      <p className="text-12">{qrShare.subtitle}</p>
      <div className="mx-auto my-4 h-[140px] w-[140px] rounded-DEFAULT border" aria-label="QR" />
      <p className="text-12">{qrShare.expiry}</p>
      <p className="text-12">{qrShare.sharedRecordsCount}</p>
      <p className="text-12">{qrShare.latestTreatment}</p>
    </div>
  );
};

/** 폰 B 스캔 화면 */
export const BScanScreen = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <p className="text-14">{COPY.phoneScreens.bScan.prompt}</p>
    </div>
  );
};

/** 폰 B 웹뷰 화면 */
export const BWebviewScreen = () => {
  const { bWebview } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <p className="text-12">{bWebview.url}</p>
      <p className="text-12">{bWebview.noAppNeeded}</p>
      <p className="text-14 font-medium">{bWebview.ownerLabel}</p>
      <p className="text-12">
        {bWebview.recordCount} · {bWebview.dateRange}
      </p>
      <p className="text-12">{bWebview.latestTreatment}</p>
      <p className="text-12">{bWebview.productUsed}</p>
      <p className="text-12">{bWebview.developer}</p>
      <p className="text-12">{bWebview.hairCondition}</p>
    </div>
  );
};
