"use client";

import { Component, useEffect, useRef, type ReactNode } from "react";
import { preconnect, preload } from "react-dom";

import dynamic from "next/dynamic";
import type { Application, SPEObject } from "@splinetool/runtime";

import { RECORD_CARDS } from "@/entities/record";
import { RECORD_STACK } from "@/shared/config";
import { useSceneFrame, useSmoothSceneFrame } from "@/shared/lib/scroll";

import { computeRecordStack, type RecordStackScene } from "../model/recordStack";
import { computeSplineHandoff, computeSplineViewport } from "../model/scene3d";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

/** 이 시간 안에 씬이 안 뜨면 CSS 폰으로 되돌린다(ms) */
const LOAD_TIMEOUT_MS = 10_000;

const DEG = Math.PI / 180;

/**
 * 카드 z(px). 모든 층은 화면에 붙어 있다(면 z 0.3~2.4) — 높이 차가 크면 폰이 기울 때 옆으로 밀려 떠 보인다.
 * 텍스처 판은 반투명으로 취급돼 깊이가 아니라 "오브젝트 원점이 카메라에 가까운 순"으로 그려지므로,
 * Veil·RecordNav·RecordFab은 커스텀 메시로 원점만 앞(45/60/62)에 두고 면은 화면에 붙여 순서를 고정한다
 * — 카드 → 흐림 막(slot 0 띠는 비움) → 네비·＋.
 */
const CARD_BASE_Z = 1;
const CARD_Z_STEP = 0.01;

/** record 섹션에서 코드가 움직이는 씬 오브젝트(`docs/plans/0004`) */
type RecordObjects = {
  rig: SPEObject;
  layer: SPEObject;
  homeScreen: SPEObject;
  veil: SPEObject;
  cards: SPEObject[];
};

const findRecordObjects = (app: Application): RecordObjects | null => {
  const rig = app.findObjectByName("RecordRig");
  const layer = app.findObjectByName("RecordLayer");
  const homeScreen = app.findObjectByName("ScreenA");
  const veil = app.findObjectByName("Veil");
  const cards = RECORD_CARDS.map((_, index) =>
    app.findObjectByName(`Card${String(index + 1).padStart(2, "0")}`),
  );
  if (!rig || !layer || !homeScreen || !veil || cards.some((card) => !card)) return null;
  return { rig, layer, homeScreen, veil, cards: cards as SPEObject[] };
};

/** 값이 바뀔 때만 쓴다 — 같은 값을 써도 Spline이 다시 그리므로 */
const setIfChanged = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]): void => {
  if (target[key] !== value) target[key] = value;
};

const applyRecordStack = (objects: RecordObjects, scene: RecordStackScene): void => {
  const { rig, cards, veil } = scene;
  setIfChanged(objects.rig.rotation, "x", rig.rotX * DEG);
  setIfChanged(objects.rig.rotation, "y", rig.rotY * DEG);
  setIfChanged(objects.rig.rotation, "z", rig.rotZ * DEG);
  setIfChanged(objects.homeScreen, "visible", !rig.isRecordScreen);
  setIfChanged(objects.layer, "visible", rig.isRecordScreen);
  setIfChanged(objects.veil, "visible", veil > 0);

  const { width, height } = RECORD_STACK.screen;
  cards.forEach((pose, index) => {
    const card = objects.cards[index];
    setIfChanged(card, "visible", pose.isVisible);
    if (!pose.isVisible) return;
    // 모델은 화면 좌표(좌상단 원점, y 아래로), 씬은 화면 중심 원점(y 위로)
    setIfChanged(card.position, "x", pose.x - width / 2);
    setIfChanged(card.position, "y", height / 2 - pose.y);
    setIfChanged(card.position, "z", CARD_BASE_Z + index * CARD_Z_STEP + pose.z);
    setIfChanged(card.rotation, "y", pose.rotY * DEG);
    setIfChanged(card.scale, "x", pose.scaleX);
    setIfChanged(card.scale, "y", pose.scaleY);
  });
};

interface SplineStageProps {
  sceneUrl: string;
  onFail: () => void;
}

interface SplineErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

/** react-spline은 로드 실패를 렌더 중 throw하므로, 페이지 전체가 깨지지 않게 여기서 막는다 */
class SplineErrorBoundary extends Component<SplineErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/**
 * 3D 폰(Spline 씬, hero~record). 히어로 합체는 씬 안의 State + Scroll 이벤트가 맡고,
 * record의 회전·기록 스택은 여기서 런타임 API로 쓴다(Scroll 이벤트는 px 고정이라 뷰포트마다 어긋남).
 * 캔버스를 CSS 폰 A 자리에 맞추고, record가 끝나면 CSS 폰으로 페이드해 넘긴다.
 */
export const SplineStage = ({ sceneUrl, onFail }: SplineStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const recordObjectsRef = useRef<RecordObjects | null>(null);
  const isFailedRef = useRef(false);

  // 서버 렌더 HTML에 <link>로 들어가서, JS가 끝나기 전부터 씬 파일(~1.3MB)을 받기 시작한다
  preconnect(new URL(sceneUrl).origin);
  preload(sceneUrl, { as: "fetch", crossOrigin: "anonymous" });

  const handleFail = () => {
    if (isFailedRef.current || appRef.current) return;
    isFailedRef.current = true;
    if (containerRef.current) containerRef.current.style.visibility = "hidden";
    onFail();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(handleFail, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
    // 마운트 시 한 번만 타이머를 건다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = (app: Application) => {
    if (isFailedRef.current) return;
    appRef.current = app; // 기록 스택 오브젝트가 없는 옛 export면 record 구간은 합쳐진 정면 폰 그대로 둔다
    recordObjectsRef.current = findRecordObjects(app);
    // RecordLayer는 export에 들어가도록 씬에선 보이게 두므로(숨긴 오브젝트는 export에서 빠짐),
    // 스크롤이 없어도 첫 프레임을 받아 지금 위치에 맞게 숨긴다
    window.dispatchEvent(new Event("scroll"));
    fadeRef.current?.classList.remove("opacity-0");
  };

  useSceneFrame((frame) => {
    const container = containerRef.current;
    if (!container || isFailedRef.current) return;

    // 크기는 로드 전부터 잡아야 한다 — 0×0 컨테이너에서는 Spline이 캔버스를 만들지 않는다
    const rect = computeSplineViewport(frame.layout);
    const { canvasOpacity } = computeSplineHandoff(frame);
    container.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.opacity = String(canvasOpacity);

    // CSS 폰으로 넘어간 뒤에는 캔버스를 숨겨 합성 비용을 없앤다. app.stop()은 쓰지 않는다 —
    // 멈췄다 켜면 Spline Scroll 상태가 합쳐진 채로 굳어 역스크롤 때 다시 갈라지지 않는다.
    // (renderOnDemand라 화면 변화가 없으면 어차피 그리지 않는다)
    container.style.visibility = canvasOpacity === 0 ? "hidden" : "visible";
  });

  // 기록 스택은 부드럽게 따라가는 스크롤로 움직인다 — 빠르게 내려도 카드가 건너뛰지 않는다.
  // 좌측 큰 날짜(RecordSection)도 같은 반감기를 써서 서로 맞는다
  useSmoothSceneFrame((frame) => {
    if (!recordObjectsRef.current || isFailedRef.current) return;
    applyRecordStack(recordObjectsRef.current, computeRecordStack(frame, RECORD_CARDS.length));
  }, RECORD_STACK.smoothHalfLifeMs);

  return (
    <div ref={containerRef} className="pointer-events-none absolute left-0 top-0 opacity-0">
      {/* 로드 완료 시 한 번 페이드 인 (스크롤 연동 opacity는 바깥 div가 담당) */}
      <div ref={fadeRef} className="h-full w-full opacity-0 transition-opacity duration-500">
        <SplineErrorBoundary onError={handleFail}>
          <Spline scene={sceneUrl} onLoad={handleLoad} />
        </SplineErrorBoundary>
      </div>
    </div>
  );
};
