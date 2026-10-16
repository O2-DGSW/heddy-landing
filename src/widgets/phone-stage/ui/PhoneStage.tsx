"use client";

import { useRef, useState } from "react";

import dynamic from "next/dynamic";

import { useSceneFrame } from "@/shared/lib/scroll";

const PhoneStageContent = dynamic(() => import("./PhoneStageContent"), { ssr: false });

/** 인트로 로딩을 방해하지 않도록 기록 섹션 접근 시에만 3D·폰 화면 코드를 준비한다. */
export const PhoneStage = () => {
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);

  useSceneFrame((frame) => {
    if (isReadyRef.current || frame.layout.isMobile) return;
    const record = frame.sections.find((section) => section.key === "record");
    if (!record || frame.scrollY < record.top - frame.layout.viewportHeight) return;
    isReadyRef.current = true;
    setIsReady(true);
  });

  return isReady ? (
    <PhoneStageContent />
  ) : (
    <div data-phone-stage className="pointer-events-none fixed inset-0 opacity-0" />
  );
};
