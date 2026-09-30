"use client";

import { useRef } from "react";
import { preconnect, preload } from "react-dom";

import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";

import { useSceneFrame } from "@/shared/lib/scroll";

import { computeSplineHandoff, computeSplineViewport } from "../model/scene3d";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

interface SplineStageProps {
  sceneUrl: string;
  onReady: () => void;
}

/**
 * 히어로 3D 폰(Spline 씬). 합체 모션은 씬 안의 State + Scroll 이벤트가 맡고,
 * 여기서는 캔버스를 CSS 폰 A 자리에 맞추고 넘겨주는 페이드만 한다.
 */
export const SplineStage = ({ sceneUrl, onReady }: SplineStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isPausedRef = useRef(false);

  // 서버 렌더 HTML에 <link>로 들어가서, JS가 끝나기 전부터 씬 파일(~1.3MB)을 받기 시작한다
  preconnect(new URL(sceneUrl).origin);
  preload(sceneUrl, { as: "fetch", crossOrigin: "anonymous" });

  const handleLoad = (app: Application) => {
    appRef.current = app;
    onReady();
  };

  useSceneFrame((frame) => {
    const container = containerRef.current;
    if (!container) return;

    // 크기는 로드 전부터 잡아야 한다 — 0×0 컨테이너에서는 Spline이 캔버스를 만들지 않는다
    const rect = computeSplineViewport(frame.layout);
    container.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;

    const app = appRef.current;
    if (!app) return;

    const { canvasOpacity } = computeSplineHandoff(frame);
    container.style.opacity = String(canvasOpacity);

    // CSS 폰으로 넘어간 뒤에는 3D 렌더를 멈춰 나머지 섹션 스크롤에 GPU를 비워 둔다
    const shouldPause = canvasOpacity === 0;
    if (shouldPause === isPausedRef.current) return;
    isPausedRef.current = shouldPause;
    container.style.visibility = shouldPause ? "hidden" : "visible";
    if (shouldPause) app.stop();
    else app.play();
  });

  return (
    <div ref={containerRef} className="pointer-events-none absolute left-0 top-0 opacity-0">
      <Spline scene={sceneUrl} onLoad={handleLoad} />
    </div>
  );
};
