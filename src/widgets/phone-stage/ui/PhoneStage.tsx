"use client";

import { useRef, type ReactNode } from "react";

import Image from "next/image";

import { PHONE, PHONE_3D, SHARE_SCREEN } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";
import { PhoneFrame } from "@/shared/ui";

import { computePhones, computeScreens } from "../model/scene";
import type { PhoneAScreenKey, PhoneBScreenKey, PhonePose } from "../model/scene";
import { computeSplineHandoff } from "../model/scene3d";
import { RecommendScreen } from "./RecommendScreen";
import { ScreenOverlay, ScreenOverlayB } from "./ScreenOverlay";
import { ScanScreen, ShareScreen, SharedRecordScreen } from "./ShareScreens";
import { SplineStage } from "./SplineStage";
import { ArScreen } from "./ArScreen";
import { ArSnapshotScreen, DetailScreen, HomeScreen, RecordScreen } from "./screens";
import { ClosingHomeScreen } from "./ClosingHomeScreen";

/** Spline 씬 URL. 없으면 CSS 폰만 쓴다(`docs/plans/0003`) */
const SPLINE_HERO_SCENE = process.env.NEXT_PUBLIC_SPLINE_HERO_SCENE;

const A_SCREENS: readonly { key: PhoneAScreenKey; node: ReactNode }[] = [
  { key: "home", node: <HomeScreen /> },
  { key: "record", node: <RecordScreen /> },
  { key: "report", node: <DetailScreen /> },
  { key: "recommend", node: <RecommendScreen /> },
  { key: "ar", node: <ArScreen /> },
  { key: "qrShare", node: <ShareScreen /> },
  { key: "closingHome", node: <ClosingHomeScreen /> },
];

const B_SCREENS: readonly { key: PhoneBScreenKey; node: ReactNode }[] = [
  { key: "ar", node: <ArSnapshotScreen /> },
  { key: "scan", node: <ScanScreen /> },
  { key: "webview", node: <SharedRecordScreen /> },
];

/** pose를 폰 프레임 엘리먼트의 transform/opacity에 그대로 반영한다. spec §2: translate(x-150,y-307.5) rotate(r) scale(S) */
const applyPose = (el: HTMLDivElement | null, pose: PhonePose): void => {
  if (!el) return;
  el.style.transform = `translate(${pose.x - PHONE.width / 2}px, ${pose.y - PHONE.pivot}px) rotate(${pose.rotate}deg) scale(${pose.scale})`;
  el.style.opacity = String(pose.opacity);
  el.classList.remove("invisible");
};

/** 폰 A·B가 모든 섹션 위에 떠 있는 fixed 레이어. 프레임마다 ref로만 갱신하고 setState는 쓰지 않는다 */
export const PhoneStage = () => {
  const phoneARef = useRef<HTMLDivElement>(null);
  const phoneBRef = useRef<HTMLDivElement>(null);
  const qrFlightRef = useRef<HTMLDivElement>(null);
  const stage3dRef = useRef<HTMLDivElement>(null);
  const aScreenRefs = useRef<Partial<Record<PhoneAScreenKey, HTMLDivElement | null>>>({});
  const bScreenRefs = useRef<Partial<Record<PhoneBScreenKey, HTMLDivElement | null>>>({});
  const isSplineFailedRef = useRef(false);
  const isSplineLoadedRef = useRef(false);

  useSceneFrame((frame) => {
    const { a, b, qrFlight } = computePhones(frame);
    const screens = computeScreens(frame);
    // 3D 폰 구간(hero 합체~report 상세 화면)은 로드 전부터 CSS 폰을 숨기고, 같은 자세에서 넘겨받는다.
    // Spline이 실패/타임아웃이면 CSS 폰으로 되돌린다
    const isSplineActive = Boolean(SPLINE_HERO_SCENE) && !isSplineFailedRef.current;
    const handoff = computeSplineHandoff(frame);
    const cssOpacity = isSplineActive ? handoff.cssOpacity : 1;
    // 캔버스와 화면 오버레이를 한 장으로 묶어 페이드한다 — 따로 반투명해지면 오버레이 아래 3D 화면(기록)이 비친다
    if (stage3dRef.current) stage3dRef.current.style.opacity = String(handoff.canvasOpacity);

    applyPose(phoneARef.current, { ...a, opacity: a.opacity * cssOpacity });

    applyPose(phoneBRef.current, { ...b, opacity: b.opacity * cssOpacity });

    if (qrFlightRef.current) {
      // 모달 속 QR(189 피그마 px)과 같은 크기에서 출발 — 피그마 px → 씬 단위 → 페이지 px
      const size =
        SHARE_SCREEN.qrModal.qrSize * (PHONE_3D.screen.width / SHARE_SCREEN.designWidth) * frame.layout.scale;
      qrFlightRef.current.style.width = `${size}px`;
      qrFlightRef.current.style.height = `${size}px`;
      qrFlightRef.current.style.transform = `translate(${qrFlight.x - size / 2}px, ${qrFlight.y - size / 2}px) rotate(${qrFlight.rotate}deg) scale(${qrFlight.scale})`;
      qrFlightRef.current.style.opacity = String(qrFlight.opacity);
    }

    (Object.keys(aScreenRefs.current) as PhoneAScreenKey[]).forEach((key) => {
      const node = aScreenRefs.current[key];
      if (node) node.style.opacity = String(screens.a[key]);
    });
    (Object.keys(bScreenRefs.current) as PhoneBScreenKey[]).forEach((key) => {
      const node = bScreenRefs.current[key];
      if (node) node.style.opacity = String(screens.b[key]);
    });
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div ref={stage3dRef} className="absolute inset-0">
        {SPLINE_HERO_SCENE && (
          <SplineStage
            sceneUrl={SPLINE_HERO_SCENE}
            onLoad={() => {
              isSplineLoadedRef.current = true;
            }}
            onFail={() => {
              isSplineFailedRef.current = true;
              // 스크롤이 없어도 CSS 폰이 바로 보이도록 프레임을 한 번 다시 받는다
              window.dispatchEvent(new Event("scroll"));
            }}
          />
        )}
        {SPLINE_HERO_SCENE && (
          <ScreenOverlay getIsEnabled={() => !isSplineFailedRef.current && isSplineLoadedRef.current} />
        )}
        {SPLINE_HERO_SCENE && (
          <ScreenOverlayB getIsEnabled={() => !isSplineFailedRef.current && isSplineLoadedRef.current} />
        )}
      </div>
      <PhoneFrame ref={phoneBRef}>
        {B_SCREENS.map(({ key, node }) => (
          <div
            key={key}
            ref={(el) => {
              bScreenRefs.current[key] = el;
            }}
            className="absolute inset-0"
          >
            {node}
          </div>
        ))}
      </PhoneFrame>
      <PhoneFrame ref={phoneARef}>
        {A_SCREENS.map(({ key, node }) => (
          <div
            key={key}
            ref={(el) => {
              aScreenRefs.current[key] = el;
            }}
            className="absolute inset-0"
          >
            {node}
          </div>
        ))}
      </PhoneFrame>
      {/* QR 비행: A 모달 속 QR에서 B 스캔 틀로 포물선을 그리며 날아간다(§3, §5 share, `docs/plans/0009`) */}
      <div
        ref={qrFlightRef}
        className="absolute left-0 top-0 overflow-hidden rounded-[6%] bg-white opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
      >
        {/* 안쪽 여백은 %가 아닌 inset으로 — padding %는 부모(뷰포트) 폭 기준이라 QR이 0으로 줄어든다 */}
        <div className="absolute inset-[5%]">
          <Image src="/screens/share/qr.png" alt="" fill loading="eager" sizes="240px" className="object-contain" />
        </div>
      </div>
    </div>
  );
};
