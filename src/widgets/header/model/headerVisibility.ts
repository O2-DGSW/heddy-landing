import { HEADER } from "@/shared/config";

export type HeaderState = {
  /** 직전 스크롤 위치 */
  lastY: number;
  /** 헤더가 위로 밀려 올라간 양(px). 0이면 완전히 보이고 헤더 높이면 완전히 숨음 */
  offset: number;
};

export const INITIAL_HEADER_STATE: HeaderState = { lastY: 0, offset: 0 };

/** 스크롤 위치 하나를 받아 헤더 오프셋을 갱신한다(순수 함수) — 스크롤한 양만큼 헤더가 따라 움직인다 */
export const stepHeaderOffset = (state: HeaderState, scrollY: number, headerHeight: number): HeaderState => {
  if (scrollY <= HEADER.alwaysVisibleY) return { lastY: scrollY, offset: 0 };
  if (scrollY === state.lastY) return state;

  const offset = Math.min(Math.max(state.offset + (scrollY - state.lastY), 0), Math.max(headerHeight, 0));
  return { lastY: scrollY, offset };
};
