"use client";

import { Component, useEffect, useRef, type ReactNode } from "react";
import { preconnect, preload } from "react-dom";

import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";

import { useSceneFrame } from "@/shared/lib/scroll";

import { computeSplineHandoff, computeSplineViewport } from "../model/scene3d";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

/** 이 시간 안에 씬이 안 뜨면 CSS 폰으로 되돌린다(ms) */
const LOAD_TIMEOUT_MS = 10_000;

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
 * 히어로 3D 폰(Spline 씬). 합체 모션은 씬 안의 State + Scroll 이벤트가 맡고,
 * 여기서는 캔버스를 CSS 폰 A 자리에 맞추고 넘겨주는 페이드만 한다.
 */
export const SplineStage = ({ sceneUrl, onFail }: SplineStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isPausedRef = useRef(false);
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
    appRef.current = app;
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

    const app = appRef.current;
    if (!app) return;

    // CSS 폰으로 넘어간 뒤에는 3D 렌더를 멈춰 나머지 섹션 스크롤에 GPU를 비워 둔다
    const shouldPause = canvasOpacity === 0;
    if (shouldPause === isPausedRef.current) return;
    isPausedRef.current = shouldPause;
    container.style.visibility = shouldPause ? "hidden" : "visible";
    if (shouldPause) {
      app.stop();
      return;
    }
    app.play();
    // 멈춰 있는 동안 지나간 스크롤을 Spline Scroll 이벤트가 놓쳤으므로 현재 위치로 다시 계산시킨다
    window.dispatchEvent(new Event("scroll"));
  });

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
