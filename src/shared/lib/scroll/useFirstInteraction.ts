"use client";

import { useEffect, useState } from "react";

const INTERACTION_EVENTS = [
  "pointermove",
  "pointerdown",
  "wheel",
  "touchstart",
  "keydown",
  "scroll",
] as const;

/**
 * 사용자가 처음 상호작용(마우스 이동·클릭·휠·터치·키·스크롤)했는지(이슈 #46). 무거운 3D·화면 밖 이미지를
 * 이때 시작해 첫 화면 로딩과 메인 스레드를 비워 둔다. 새로고침으로 스크롤이 복원된 경우(히어로가 아님)엔 바로 true.
 * 한 번 true가 되면 다시 바뀌지 않는다(프레임마다 setState 아님).
 */
export const useFirstInteraction = (): boolean => {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, handleInteraction));
      setHasInteracted(true);
    };
    if (window.scrollY > 0) {
      handleInteraction();
      return undefined;
    }
    INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, handleInteraction, { passive: true }));
    return () => INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, handleInteraction));
  }, []);

  return hasInteracted;
};
