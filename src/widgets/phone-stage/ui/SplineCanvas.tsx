"use client";

import { useEffect, useRef } from "react";

import type { Application } from "@splinetool/runtime";

interface SplineCanvasProps {
  scene: string;
  onLoad: (app: Application) => void;
  onError: () => void;
}

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
    void import("@splinetool/runtime")
      .then(async ({ Application: SplineApplication }) => {
        if (isDisposed) return;
        app = new SplineApplication(canvas, { renderMode: "manual" });
        await app.load(scene);
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
