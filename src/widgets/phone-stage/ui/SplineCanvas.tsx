"use client";

import { useEffect, useRef } from "react";

import type { Application } from "@splinetool/runtime";

import { isFullpageSliding } from "@/shared/lib/scroll";

import { preloadSplineRuntime, preloadSplineScene, waitWhile } from "../lib/splinePreload";

interface SplineCanvasProps {
  scene: string;
  onLoad: (app: Application) => void;
  onError: () => void;
}

/** 화면 이동 중 3D 초기화를 미루는 최대 시간(ms) — 화면 이동(0.9초)보다 조금 길게 */
const SLIDE_WAIT_MAX_MS = 1500;

/** 런타임의 자동 렌더와 중복되지 않게 공통 프레임 끝의 명시적 요청으로만 그린다. */
const SplineCanvas = ({ scene, onLoad, onError }: SplineCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onLoad, onError]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let app: Application | null = null;
    let isDisposed = false;
    // 씬 파일·런타임은 첫 화면 직후 미리 받아 둔다(`PhoneStage`, 이슈 #88) — 받아 둔 데이터로 바로 시작한다
    void Promise.all([preloadSplineRuntime(), preloadSplineScene(scene)])
      .then(async ([{ Application: SplineApplication }, buffer]) => {
        if (isDisposed) return;
        // 씬 해석·초기화는 수백 ms 걸리는 무거운 작업이라 화면이 미끄러지는 동안(0.9초)은 미룬다(이슈 #88)
        await waitWhile(isFullpageSliding, SLIDE_WAIT_MAX_MS);
        if (isDisposed) return;
        app = new SplineApplication(canvas, { renderMode: "manual" });
        // 타입은 void지만 런타임 구현은 Promise를 돌려준다(씬 해석·압축 해제를 기다린다)
        await (app.start(buffer) as unknown as Promise<void>);
        if (!isDisposed) onLoadRef.current(app);
      })
      .catch(() => {
        if (isDisposed) return;
        app?.dispose();
        app = null;
        onErrorRef.current();
      });
    return () => {
      isDisposed = true;
      app?.dispose();
    };
  }, [scene]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
};

export default SplineCanvas;
