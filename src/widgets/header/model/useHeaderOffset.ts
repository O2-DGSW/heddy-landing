"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { useSceneFrame, type SceneFrame } from "@/shared/lib/scroll";

import { INITIAL_HEADER_STATE, consumeHeaderScroll, stepHeaderOffset, type HeaderState } from "./headerVisibility";

const LINE_HEIGHT_PX = 16;

const wheelDeltaPx = (event: WheelEvent): number => {
  if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT_PX;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

/**
 * 헤더 오프셋(위로 밀려 올라간 양)을 CSS 변수 --header-offset으로만 쓴다(프레임마다 setState 금지).
 * - 아래로 휠·터치: 헤더가 먼저 올라가고 그동안 화면은 멈춘다. 다 숨은 뒤에 화면이 스크롤된다.
 * - 위로: 화면이 스크롤되는 만큼 헤더가 내려온다(스크롤 프레임 기준).
 * - 스크롤바·키보드 등 휠/터치 밖의 스크롤도 스크롤 프레임이 같은 규칙으로 따라간다.
 */
export const useHeaderOffset = (headerRef: RefObject<HTMLElement | null>): void => {
  const stateRef = useRef<HeaderState>(INITIAL_HEADER_STATE);

  const write = useCallback(
    (next: HeaderState) => {
      if (next.offset !== stateRef.current.offset) {
        headerRef.current?.style.setProperty("--header-offset", `${next.offset}px`);
      }
      stateRef.current = next;
    },
    [headerRef],
  );

  const handleFrame = useCallback(
    (frame: SceneFrame) => {
      const header = headerRef.current;
      if (!header) return;
      write(stepHeaderOffset(stateRef.current, frame.scrollY, header.offsetHeight));
    },
    [headerRef, write],
  );
  useSceneFrame(handleFrame);

  useEffect(() => {
    /** delta(px)만큼 아래로 스크롤하려는 입력을 처리한다. 헤더가 가져갔으면 true(기본 스크롤을 막아야 함) */
    const takeDown = (delta: number): boolean => {
      const header = headerRef.current;
      if (!header) return false;
      const { state, remainder } = consumeHeaderScroll(stateRef.current, delta, header.offsetHeight);
      if (state === stateRef.current) return false;
      // 스크롤 프레임이 이 갱신을 다시 세지 않도록 lastY는 그대로 두고 오프셋만 쓴다
      write(state);
      if (remainder > 0) window.scrollBy(0, remainder);
      return true;
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (takeDown(wheelDeltaPx(event))) event.preventDefault();
    };

    let lastTouchY: number | null = null;
    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      const delta = lastTouchY - y; // 손가락을 위로 올리면 아래로 스크롤
      lastTouchY = y;
      if (takeDown(delta) && event.cancelable) event.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [headerRef, write]);
};
