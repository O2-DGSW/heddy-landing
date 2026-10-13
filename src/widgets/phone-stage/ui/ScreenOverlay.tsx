"use client";

import { useRef } from "react";

import Image from "next/image";

import { RECORD_CARDS } from "@/entities/record";
import { DETAIL_SCREEN, PHONE_3D, RECOMMEND_SCREEN, RECORD_STACK, TIMELINE } from "@/shared/config";
import { lerp } from "@/shared/lib/motion";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeRecommendCards } from "../model/recommendScene";
import { computeSettledRecordCards, topCardIndex } from "../model/recordStack";
import { computeScreenOverlay } from "../model/scene3d";
import { ArScreen } from "./ArScreen";
import { RecommendCard, RecommendScreen, RecommendTabBar } from "./RecommendScreen";
import { DetailScreen } from "./screens";

/** 탭 물결 지름(px, 화면 좌표) — 다 퍼지면 카드 폭을 덮는다 */
const RIPPLE_SIZE = 64;
/** 카드 모서리 반경(px, 화면 좌표) */
const CARD_RADIUS = 12;
/** "추천" 탭 물결 지름(피그마 px) */
const TAB_RIPPLE_SIZE = 56;
/** 폰 밖으로 떠오른 추천 카드 그림자(피그마 px) — 떠오른 정도만큼 진해진다 */
const POP_SHADOW = { y: 18, blur: 40, alpha: 0.18 };

/** 누르는 위치: 기록 리스트 맨 위 카드(최신 기록) 가운데 */
const TAP_POINT = (() => {
  const settled = computeSettledRecordCards(RECORD_CARDS.length);
  const top = settled[topCardIndex(settled)];
  return { x: top.x, y: top.y };
})();

interface ScreenOverlayProps {
  /** Spline이 로드돼 3D 폰이 보이는 중인지 — 아니면 오버레이를 숨긴다 */
  getIsEnabled: () => boolean;
}

/**
 * 3D 폰 화면 위에 겹치는 HTML 화면(`docs/plans/0005`). 기록 리스트의 맨 위 카드를 누르면(물결)
 * 상세 화면이 오른쪽에서 밀려 들어오고(상태바·탭바는 고정), 뒤 리스트는 살짝 어두워진다.
 * 추천 섹션 전에는 하단 "추천" 탭을 누르면(물결·탭 색 이동) 추천 화면이 오른쪽에서 밀려 들어오고(상태바·탭바
 * 고정, 상세 화면은 왼쪽으로 나감), 추천 섹션에선 추천 카드 3장이 화면 밖(잘리지 않는 레이어)으로
 * 떠올랐다가 돌아간다(`docs/plans/0007`). AR 섹션에선 AR 화면(스타일 전환)을 보여 준다(`docs/plans/0008`).
 * 프레임마다 ref로만 쓴다.
 */
export const ScreenOverlay = ({ getIsEnabled }: ScreenOverlayProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const fixedBarsRef = useRef<HTMLDivElement>(null);
  const recommendRef = useRef<HTMLDivElement>(null);
  const recommendTabBarRef = useRef<HTMLDivElement>(null);
  const tabRippleRef = useRef<HTMLDivElement>(null);
  const arRef = useRef<HTMLDivElement>(null);
  const popCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { screen, island } = PHONE_3D;
  const designScale = screen.width / RECOMMEND_SCREEN.designWidth;
  const imageScale = screen.width / DETAIL_SCREEN.imageWidthPx;

  useSceneFrame((frame) => {
    const root = rootRef.current;
    if (!root) return;
    const overlay = computeScreenOverlay(frame);
    const isShown = getIsEnabled() && overlay.opacity > 0;
    root.style.transform = `translate(${overlay.x}px, ${overlay.y}px) scale(${overlay.scale}) perspective(${overlay.perspective}px) rotateX(${overlay.rotateXDeg}deg) translateZ(${overlay.translateZ}px)`;
    // 캔버스와 같이 사라지는 페이드는 PhoneStage가 둘을 묶어서 한다 — 여기선 켜고 끄기만
    root.style.opacity = isShown ? "1" : "0";
    root.style.visibility = isShown ? "visible" : "hidden";

    // 눌린 카드(3D 카드와 같이 줄어듦) 위에 옅은 하이라이트 + 카드 안에서만 퍼지는 물결
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(-50%, -50%) scale(${1 - TIMELINE.report.tapPressScale * overlay.press})`;
      cardRef.current.style.backgroundColor = `rgba(0,0,0,${0.06 * overlay.press})`;
    }
    if (rippleRef.current) {
      rippleRef.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.2, 4, overlay.ripple)})`;
      rippleRef.current.style.opacity = overlay.ripple > 0 ? String(0.1 * (1 - overlay.ripple)) : "0";
    }
    if (dimRef.current) dimRef.current.style.opacity = String(TIMELINE.report.pushDimAlpha * overlay.push);
    const { tabSwitch } = overlay;
    if (detailRef.current) {
      // 기록 위로 오른쪽에서 들어오고(push), 추천 탭을 누르면 왼쪽으로 나간다(slide)
      detailRef.current.style.transform = `translateX(${(1 - overlay.push - tabSwitch.slide) * 100}%)`;
      detailRef.current.style.visibility = overlay.push > 0 && tabSwitch.slide < 1 ? "visible" : "hidden";
    }
    if (fixedBarsRef.current) fixedBarsRef.current.style.visibility = overlay.push > 0 ? "visible" : "hidden";
    if (recommendRef.current) {
      recommendRef.current.style.transform = `translateX(${(1 - tabSwitch.slide) * 100}%)`;
      recommendRef.current.style.visibility = tabSwitch.slide > 0 ? "visible" : "hidden";
    }
    // 탭바: 기록 활성(상세 화면 하단 이미지) 위로 추천 활성 탭바가 옮겨 오고, 추천 탭 자리에서 물결이 퍼진다
    if (recommendTabBarRef.current) {
      recommendTabBarRef.current.style.opacity = String(tabSwitch.tabActive);
      recommendTabBarRef.current.style.visibility = overlay.push > 0 ? "visible" : "hidden";
    }
    if (tabRippleRef.current) {
      tabRippleRef.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.3, 1.8, tabSwitch.ripple)})`;
      tabRippleRef.current.style.opacity =
        tabSwitch.ripple > 0 ? String(0.12 * (1 - tabSwitch.ripple) + 0.06 * tabSwitch.press) : "0";
    }

    // AR 섹션: 폰이 화면 밖으로 빠졌다 돌아오는 사이에 AR 화면으로 바뀐다(`docs/plans/0008`)
    if (arRef.current) arRef.current.style.visibility = overlay.isArScreen ? "visible" : "hidden";

    computeRecommendCards(frame).forEach((pose, index) => {
      const card = popCardRefs.current[index];
      if (!card) return;
      card.style.visibility = pose.isVisible ? "visible" : "hidden";
      if (!pose.isVisible) return;
      card.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotateDeg}deg) scale(${pose.scale})`;
      card.style.boxShadow = `0 ${POP_SHADOW.y * pose.amount}px ${POP_SHADOW.blur * pose.amount}px rgba(0,0,0,${POP_SHADOW.alpha * pose.amount})`;
    });
  });

  return (
    <div ref={rootRef} className="invisible absolute left-0 top-0 h-0 w-0 origin-top-left">
      <div
        className="absolute overflow-hidden"
        style={{
          left: -screen.width / 2,
          top: -screen.height / 2,
          width: screen.width,
          height: screen.height,
          borderRadius: `${screen.radiusX}px / ${screen.radiusY}px`,
        }}
      >
        <div
          ref={cardRef}
          className="absolute overflow-hidden"
          style={{
            left: `${(TAP_POINT.x / RECORD_STACK.screen.width) * 100}%`,
            top: `${(TAP_POINT.y / RECORD_STACK.screen.height) * 100}%`,
            width: `${(RECORD_STACK.card.width / RECORD_STACK.screen.width) * 100}%`,
            height: `${(RECORD_STACK.card.height / RECORD_STACK.screen.height) * 100}%`,
            borderRadius: CARD_RADIUS,
          }}
        >
          <div
            ref={rippleRef}
            className="absolute left-1/2 top-1/2 rounded-full bg-neutral-900 opacity-0"
            style={{ width: RIPPLE_SIZE, height: RIPPLE_SIZE }}
          />
        </div>
        <div ref={dimRef} className="absolute inset-0 bg-black opacity-0" />
        <div ref={detailRef} className="invisible absolute inset-0 shadow-[-8px_0_24px_rgba(0,0,0,.08)]">
          <DetailScreen width={screen.width} height={screen.height} />
        </div>
        {/* 추천 화면(본문·제목): 추천 탭을 누르면 오른쪽에서 밀려 들어온다. 상태바·탭바는 아래 고정 레이어가 그린다 */}
        <div ref={recommendRef} className="invisible absolute inset-0">
          <RecommendScreen width={screen.width} height={screen.height} hasChrome={false} />
        </div>
        {/* 상태바·하단 탭바는 기록 화면과 같아서, iOS push처럼 밀려 들어오지 않고 제자리에 둔다 */}
        <div ref={fixedBarsRef} className="invisible">
          <div
            className="absolute left-0 top-0 w-full overflow-hidden"
            style={{ height: DETAIL_SCREEN.statusBarPx * imageScale }}
          >
            <Image
              src="/screens/detail/top.png"
              alt=""
              width={DETAIL_SCREEN.imageWidthPx}
              height={DETAIL_SCREEN.fixedTopPx}
              loading="eager"
              sizes="280px"
              className="w-full"
            />
          </div>
          <div
            className="absolute bottom-0 left-0 w-full"
            style={{ height: DETAIL_SCREEN.fixedBottomPx * imageScale }}
          >
            <Image
              src="/screens/detail/bottom.png"
              alt=""
              fill
              loading="eager"
              sizes="280px"
              className="object-cover"
            />
          </div>
        </div>

        {/* 추천 활성 탭바(피그마 px를 화면 폭에 맞춰 축소) + 추천 탭 물결 */}
        <div
          ref={recommendTabBarRef}
          className="invisible absolute bottom-0 left-0 h-[106px] w-[402px] origin-bottom-left opacity-0"
          style={{ transform: `scale(${designScale})` }}
        >
          <RecommendTabBar className="absolute inset-0" />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-[106px] w-[402px] origin-bottom-left overflow-hidden"
          style={{ transform: `scale(${designScale})` }}
        >
          <div
            ref={tabRippleRef}
            className="absolute rounded-full bg-neutral-900 opacity-0"
            style={{
              left: RECOMMEND_SCREEN.recommendTabCenter.x,
              top: RECOMMEND_SCREEN.recommendTabCenter.y,
              width: TAB_RIPPLE_SIZE,
              height: TAB_RIPPLE_SIZE,
            }}
          />
        </div>
        {/* AR 화면: 위의 화면들을 모두 덮는다(상태바·홈 인디케이터 포함) */}
        <div ref={arRef} className="invisible absolute inset-0">
          <ArScreen width={screen.width} height={screen.height} />
        </div>
        {/* 다이내믹 아일랜드: 3D 폰 화면의 구멍 자리를 오버레이가 덮으므로 다시 그린다 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
          style={{ top: island.centerY, width: island.width, height: island.height }}
        />
      </div>
      {/* 폰 밖으로 떠오르는 추천 카드: 화면 모서리에 잘리지 않도록 화면 컨테이너 밖에, 같은 좌표(피그마 px)로 둔다 */}
      <div
        className="pointer-events-none absolute origin-top-left"
        style={{
          left: -screen.width / 2,
          top: -screen.height / 2,
          transform: `scale(${designScale})`,
        }}
      >
        {RECOMMEND_SCREEN.photoCrops.map((_, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: RECOMMEND_SCREEN.card.x,
              top:
                RECOMMEND_SCREEN.fixedTop +
                RECOMMEND_SCREEN.card.firstTop +
                index * RECOMMEND_SCREEN.card.pitch,
            }}
          >
            <RecommendCard
              ref={(node) => {
                popCardRefs.current[index] = node;
              }}
              index={index}
              className="invisible origin-center will-change-transform"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
