"use client";

import { useRef } from "react";

import dynamic from "next/dynamic";

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
  const isLoadedRef = useRef(false);

  const handleLoad = () => {
    isLoadedRef.current = true;
    onReady();
  };

  useSceneFrame((frame) => {
    const container = containerRef.current;
    if (!container || !isLoadedRef.current) return;

    const rect = computeSplineViewport(frame.layout);
    const { canvasOpacity } = computeSplineHandoff(frame);
    container.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.opacity = String(canvasOpacity);
  });

  return (
    <div ref={containerRef} className="pointer-events-none absolute left-0 top-0 opacity-0">
      <Spline scene={sceneUrl} onLoad={handleLoad} />
    </div>
  );
};
