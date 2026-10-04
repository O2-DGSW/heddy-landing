"use client";

import { useRef } from "react";

import Image from "next/image";

import { RECORD_CARDS } from "@/entities/record";
import { DETAIL_SCREEN, PHONE_3D, RECORD_STACK, TIMELINE } from "@/shared/config";
import { lerp } from "@/shared/lib/motion";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeSettledRecordCards, topCardIndex } from "../model/recordStack";
import { computeScreenOverlay } from "../model/scene3d";
import { DetailScreen } from "./screens";

/** 탭 물결 지름(px, 화면 좌표) — 다 퍼지면 카드 폭을 덮는다 */
const RIPPLE_SIZE = 64;
/** 카드 모서리 반경(px, 화면 좌표) */
const CARD_RADIUS = 12;

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
 * 프레임마다 ref로만 쓴다.
 */
export const ScreenOverlay = ({ getIsEnabled }: ScreenOverlayProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const fixedBarsRef = useRef<HTMLDivElement>(null);
  const { screen } = PHONE_3D;
  const imageScale = screen.width / DETAIL_SCREEN.imageWidthPx;

  useSceneFrame((frame) => {
    const root = rootRef.current;
    if (!root) return;
    const overlay = computeScreenOverlay(frame);
    const isShown = getIsEnabled() && overlay.opacity > 0;
    root.style.transform = `translate(${overlay.x}px, ${overlay.y}px) scale(${overlay.scale}) perspective(${overlay.perspective}px) rotateX(${overlay.rotateXDeg}deg) translateZ(${overlay.translateZ}px)`;
    root.style.opacity = isShown ? String(overlay.opacity) : "0";
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
    if (detailRef.current) {
      detailRef.current.style.transform = `translateX(${(1 - overlay.push) * 100}%)`;
      detailRef.current.style.visibility = overlay.push > 0 ? "visible" : "hidden";
    }
    if (fixedBarsRef.current) fixedBarsRef.current.style.visibility = overlay.push > 0 ? "visible" : "hidden";
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
            width: RECORD_STACK.card.width,
            height: RECORD_STACK.card.height,
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
            <Image src="/screens/detail/bottom.png" alt="" fill loading="eager" sizes="280px" className="object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};
