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

/**
 * 아래로 스크롤하는 양을 헤더가 먼저 가져간다 — 헤더가 다 숨을 때까지 화면은 안 움직이고,
 * 헤더가 숨은 뒤 남는 양(remainder)만 화면 스크롤로 넘긴다. 위로 스크롤은 가로채지 않는다.
 */
export const consumeHeaderScroll = (
  state: HeaderState,
  delta: number,
  headerHeight: number,
): { state: HeaderState; remainder: number } => {
  if (delta <= 0 || headerHeight <= 0 || state.offset >= headerHeight) return { state, remainder: delta };
  const wanted = state.offset + delta;
  const offset = Math.min(wanted, headerHeight);
  return { state: { ...state, offset }, remainder: wanted - offset };
};

/** 스크롤이 멈췄을 때 어중간하게 걸친 헤더를 가까운 쪽(완전히 보임/숨음)으로 마무리한다 */
export const settleHeaderOffset = (state: HeaderState, headerHeight: number): HeaderState => {
  if (state.offset <= 0 || state.offset >= headerHeight) return state;
  return { ...state, offset: state.offset > headerHeight / 2 ? headerHeight : 0 };
};
