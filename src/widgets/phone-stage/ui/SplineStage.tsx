"use client";

import { Component, useEffect, useRef, type ReactNode } from "react";
import { preconnect } from "react-dom";

import dynamic from "next/dynamic";
import type { Application, SPEObject } from "@splinetool/runtime";

import { RECORD_CARD_IMAGE_COUNT, RECORD_CARDS, recordCardNo } from "@/entities/record";
import { RECORD_STACK } from "@/shared/config";
import { useAfterSceneFrame, useSceneFrame, useSmoothSceneFrame } from "@/shared/lib/scroll";

import { computeRecordStack, type RecordStackScene } from "../model/recordStack";
import { computeStageReveal } from "../model/scene";
import {
  computeShareRigs,
  computeSplineHandoff,
  computeSplineViewport,
  fitShareRigB,
} from "../model/scene3d";

const Spline = dynamic(() => import("./SplineCanvas"), { ssr: false });

/** 이 시간 안에 씬이 안 뜨면 CSS 폰으로 되돌린다(ms) */
const LOAD_TIMEOUT_MS = 10_000;

const DEG = Math.PI / 180;

/**
 * 캔버스는 항상 2배로 그린다. 일반 모니터(DPR 1)는 2배로 올려 화면 텍스처가 밉맵 축소로 뭉개지지 않게 하고,
 * 3배 화면 폰(DPR 3)은 2배로 낮춰 GPU·배터리 부담을 줄인다(이슈 #50 — 눈으로 차이가 거의 없다).
 */
const PIXEL_RATIO = 2;

/** 공개 API에 없는 런타임 내부 — 버전이 바뀌어 없으면 기본 해상도로 둔다 */
type SplineInternals = {
  _renderer?: { getPixelRatio: () => number; setPixelRatio: (ratio: number) => void };
  _resize?: (force?: boolean) => void;
  /** 렌더 루프가 프레임마다 부르는 함수. 바뀐 게 없으면 그리지 않는다 */
  render?: (time: number) => void;
};

/**
 * 방금 쓴 오브젝트 값을 이 프레임에 바로 그린다. Spline 렌더 루프(rAF)는 스크롤 프레임보다 먼저 돌아서,
 * 그대로 두면 캔버스가 DOM 화면 오버레이보다 한 프레임 늦어 빠르게 움직일 때 화면이 폰에서 미끄러진다.
 * 시각은 이 프레임 rAF 시각을 써서 루프와 dt가 어긋나지 않게 한다. 그린 뒤엔 루프가 같은 장면을 다시 그리지 않는다.
 */
const renderNow = (app: Application): void => {
  app.requestRender();
  const { render } = app as unknown as SplineInternals;
  if (typeof render !== "function") return;
  const time = document.timeline.currentTime;
  render(typeof time === "number" ? time : performance.now());
};

const supersample = (app: Application): void => {
  const internals = app as unknown as SplineInternals;
  const renderer = internals._renderer;
  if (!renderer || typeof internals._resize !== "function") return;
  if (renderer.getPixelRatio() === PIXEL_RATIO) return;
  renderer.setPixelRatio(PIXEL_RATIO);
  internals._resize(true);
};

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
  const cards = RECORD_CARDS.map((card) => app.findObjectByName(`Card${recordCardNo(card.cardNo)}`));
  if (!rig || !layer || !homeScreen || !veil || cards.some((card) => !card)) return null;
  // 스택에 쓰지 않는 카드(2025년, 이슈 #42)는 export엔 보이게 남아 있으므로 여기서 숨긴다
  const usedNos = new Set(RECORD_CARDS.map((card) => card.cardNo));
  for (let no = 1; no <= RECORD_CARD_IMAGE_COUNT; no += 1) {
    if (usedNos.has(no)) continue;
    const unused = app.findObjectByName(`Card${recordCardNo(no)}`);
    if (unused) unused.visible = false;
  }
  return { rig, layer, homeScreen, veil, cards: cards as SPEObject[] };
};

/** share 섹션에서 코드가 움직이는 씬 오브젝트(`docs/plans/0009`) */
type ShareObjects = {
  rigB: SPEObject;
  phoneA: SPEObject;
  phoneB: SPEObject;
  /** 그림자 바닥과 로드 때 높이 — closing에서 폰이 커지면 같은 배율만큼 내린다(`docs/plans/0010`) */
  floor: SPEObject | null;
  floorY: number;
};

const findShareObjects = (app: Application): ShareObjects | null => {
  const rigB = app.findObjectByName("ShareRigB");
  const phoneA = app.findObjectByName("PhoneA");
  const phoneB = app.findObjectByName("PhoneB");
  if (!rigB || !phoneA || !phoneB) return null;
  const floor = app.findObjectByName("ShadowCatcher") ?? null;
  return { rigB, phoneA, phoneB, floor, floorY: floor?.position.y ?? 0 };
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
  /**
   * 기록 섹션에 접근했고 동작 줄이기가 아닐 때 시작한다. 로딩 중에는 CSS 폰을 표시한다.
   */
  isStarted: boolean;
  onLoad: () => void;
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
export const SplineStage = ({ sceneUrl, isStarted, onLoad, onFail }: SplineStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const recordObjectsRef = useRef<RecordObjects | null>(null);
  /** share에서 폰 B를 움직이는 묶음(Spline 씬 `ShareRigB`)과 크기 기준이 되는 폰 두 대. 옛 export엔 묶음이 없어 null이면 B는 합쳐진 채로 둔다 */
  const shareObjectsRef = useRef<ShareObjects | null>(null);
  const isFailedRef = useRef(false);

  // PhoneStage가 첫 화면 이후 유휴 시간에 마운트한다. 씬 다운로드 전에 연결을 준비한다.
  preconnect(new URL(sceneUrl).origin);

  const handleFail = () => {
    if (isFailedRef.current || appRef.current) return;
    isFailedRef.current = true;
    if (containerRef.current) containerRef.current.style.visibility = "hidden";
    onFail();
  };

  useEffect(() => {
    if (!isStarted) return undefined;
    const timeoutId = window.setTimeout(handleFail, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
    // 시작할 때 한 번만 타이머를 건다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleLoad = (app: Application) => {
    if (isFailedRef.current) return;
    supersample(app);
    appRef.current = app; // 기록 스택 오브젝트가 없는 옛 export면 record 구간은 합쳐진 정면 폰 그대로 둔다
    recordObjectsRef.current = findRecordObjects(app);
    shareObjectsRef.current = findShareObjects(app);
    // RecordLayer는 export에 들어가도록 씬에선 보이게 두므로(숨긴 오브젝트는 export에서 빠짐),
    // 스크롤이 없어도 첫 프레임을 받아 지금 위치에 맞게 숨긴다
    onLoad();
    window.dispatchEvent(new Event("scroll"));
    fadeRef.current?.classList.remove("opacity-0");
  };

  useSceneFrame((frame) => {
    const container = containerRef.current;
    if (!container || isFailedRef.current) return;

    // 크기는 로드 전부터 잡아야 한다 — 0×0 컨테이너에서는 Spline이 캔버스를 만들지 않는다
    const rect = computeSplineViewport(frame.layout);
    const { canvasOpacity, yOffset } = computeSplineHandoff(frame);
    // 추천 끝에서 페이지와 함께 위로 빠지고, AR에서 아래에서 올라온다(`docs/plans/0008`)
    container.style.transform = `translate(${rect.left}px, ${rect.top + yOffset}px)`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    // 페이드는 PhoneStage가 캔버스·화면 오버레이를 묶어서 한다(따로 반투명하면 오버레이 아래가 비친다)
    container.style.opacity = canvasOpacity > 0 ? "1" : "0";

    // CSS 폰으로 넘어간 뒤에는 캔버스를 숨겨 합성 비용을 없앤다. app.stop()은 쓰지 않는다 —
    // 멈췄다 켜면 Spline Scroll 상태가 합쳐진 채로 굳어 역스크롤 때 다시 갈라지지 않는다.
    // (renderOnDemand라 화면 변화가 없으면 어차피 그리지 않는다)
    container.style.visibility = canvasOpacity === 0 ? "hidden" : "visible";

    // share: 폰 A(RecordRig)는 왼쪽으로, 폰 B(ShareRigB)는 오른쪽에서 들어와 나란히 선다(`docs/plans/0009`)
    const rigs = computeShareRigs(frame);
    const recordRig = recordObjectsRef.current?.rig;
    if (recordRig) {
      setIfChanged(recordRig.position, "x", rigs.a.x);
      // closing: 폰 A가 커진다(묶음 원점 = 폰 중심이라 제자리에서 커짐)
      setIfChanged(recordRig.scale, "x", rigs.a.scale);
      setIfChanged(recordRig.scale, "y", rigs.a.scale);
      setIfChanged(recordRig.scale, "z", rigs.a.scale);
    }
    const share = shareObjectsRef.current;
    if (share) {
      const { rigB, phoneA, phoneB, floor, floorY } = share;
      // 커진 폰이 바닥을 뚫지 않게 바닥도 같은 배율만큼 내린다
      if (floor) setIfChanged(floor.position, "y", floorY * rigs.a.scale);
      const rig = fitShareRigB(
        rigs.b,
        { x: phoneB.position.x, y: phoneB.position.y, z: phoneB.position.z, scale: phoneB.scale.x },
        phoneA.scale.x,
      );
      setIfChanged(rigB.position, "x", rig.x);
      setIfChanged(rigB.position, "y", rig.y);
      setIfChanged(rigB.position, "z", rig.z);
      setIfChanged(rigB.rotation, "z", rig.rotateZDeg * DEG);
      setIfChanged(rigB.scale, "x", rig.scale);
      setIfChanged(rigB.scale, "y", rig.scale);
      setIfChanged(rigB.scale, "z", rig.scale);
    }
  });

  // 기록 스택은 부드럽게 따라가는 스크롤로 움직인다 — 빠르게 내려도 카드가 건너뛰지 않는다.
  // 좌측 큰 날짜(RecordSection)도 같은 반감기를 써서 서로 맞는다
  useSmoothSceneFrame((frame) => {
    if (!recordObjectsRef.current || isFailedRef.current || computeStageReveal(frame) === 0) return;
    applyRecordStack(recordObjectsRef.current, computeRecordStack(frame, RECORD_CARDS.length));
  }, RECORD_STACK.smoothHalfLifeMs);

  useAfterSceneFrame((frame) => {
    if (!appRef.current || isFailedRef.current || computeStageReveal(frame) === 0) return;
    if (computeSplineHandoff(frame).canvasOpacity > 0) renderNow(appRef.current);
  });

  return (
    <div ref={containerRef} className="pointer-events-none absolute left-0 top-0 opacity-0">
      {/* 로드 완료 시 한 번 페이드 인 (스크롤 연동 opacity는 바깥 div가 담당) */}
      <div ref={fadeRef} className="h-full w-full opacity-0 transition-opacity duration-500">
        {isStarted && (
          <SplineErrorBoundary onError={handleFail}>
            <Spline scene={sceneUrl} onLoad={handleLoad} onError={handleFail} />
          </SplineErrorBoundary>
        )}
      </div>
    </div>
  );
};
