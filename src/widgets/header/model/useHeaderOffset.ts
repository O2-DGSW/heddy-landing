"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { HEADER, STAGE_LAYOUT } from "@/shared/config";
import { smoothScrollBy, useSceneFrame, wheelDeltaPx, type SceneFrame } from "@/shared/lib/scroll";

import {
  INITIAL_HEADER_STATE,
  consumeHeaderScroll,
  settleHeaderOffset,
  stepHeaderOffset,
  type HeaderState,
} from "./headerVisibility";

/**
 * 헤더 오프셋(위로 밀려 올라간 양)을 CSS 변수 --header-offset으로만 쓴다(프레임마다 setState 금지).
 * - 아래로 휠·터치: 헤더가 먼저 올라가고 그동안 화면은 멈춘다. 다 숨은 뒤에 화면이 스크롤된다.
 * - 위로: 화면이 스크롤되는 만큼 헤더가 내려온다(스크롤 프레임 기준).
 * - 스크롤이 멈추면 걸친 헤더는 가까운 쪽으로 마무리되고, 움직임은 CSS transition이 부드럽게 이어 준다.
 * - 스크롤바·키보드 등 휠/터치 밖의 스크롤도 스크롤 프레임이 같은 규칙으로 따라간다.
 * - 휠은 관성 스크롤(`useSmoothWheelScroll`)보다 먼저(캡처 단계) 받고, 헤더가 숨은 뒤 남는 양은 관성 스크롤로 넘긴다.
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

  const settleTimerRef = useRef<number | null>(null);
  /** 입력이 잠시 멈추면 걸쳐 있는 헤더를 가까운 쪽으로 마무리한다 — CSS transition이 부드럽게 이어 준다 */
  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      const header = headerRef.current;
      if (header) write(settleHeaderOffset(stateRef.current, header.offsetHeight));
    }, HEADER.settleIdleMs);
  }, [headerRef, write]);

  useEffect(
    () => () => {
      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    },
    [],
  );

  const handleFrame = useCallback(
    (frame: SceneFrame) => {
      const header = headerRef.current;
      if (!header) return;
      write(stepHeaderOffset(stateRef.current, frame.scrollY, header.offsetHeight));
      scheduleSettle();
    },
    [headerRef, write, scheduleSettle],
  );
  useSceneFrame(handleFrame);

  useEffect(() => {
    /**
     * delta(px)만큼 아래로 스크롤하려는 입력을 처리한다. 헤더가 가져갔으면 true(기본 스크롤을 막아야 함).
     * 헤더가 숨은 뒤 남는 양은 scrollRest로 넘긴다(휠은 관성 스크롤, 터치는 바로)
     */
    const takeDown = (delta: number, scrollRest: (remainder: number) => void): boolean => {
      const header = headerRef.current;
      if (!header) return false;
      const { state, remainder } = consumeHeaderScroll(stateRef.current, delta, header.offsetHeight);
      if (state === stateRef.current) return false;
      // 스크롤 프레임이 이 갱신을 다시 세지 않도록 lastY는 그대로 두고 오프셋만 쓴다
      write(state);
      scheduleSettle();
      if (remainder > 0) scrollRest(remainder);
      return true;
    };

    const handleWheel = (event: WheelEvent) => {
      // 데스크톱은 한 화면 컨트롤러가 휠 전체를 받는다. 헤더는 실제 스크롤 프레임을 따른다.
      if (window.innerWidth >= STAGE_LAYOUT.desktop.breakpoint) return;
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (takeDown(wheelDeltaPx(event, window.innerHeight), smoothScrollBy)) event.preventDefault();
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
      if (takeDown(delta, (remainder) => window.scrollBy(0, remainder)) && event.cancelable)
        event.preventDefault();
    };

    // 캡처 단계: 관성 스크롤(window 버블 단계)보다 먼저 받아 헤더가 먼저 가져간다
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [headerRef, write, scheduleSettle]);
};
