import { HEADER } from "@/shared/config";

export type HeaderState = {
  isVisible: boolean;
  /** 직전 스크롤 위치 */
  lastY: number;
  /** 스크롤 방향이 마지막으로 바뀐 지점 */
  turnY: number;
  /** 직전 이동 방향: 1 아래, -1 위, 0 아직 없음 */
  direction: -1 | 0 | 1;
};

export const INITIAL_HEADER_STATE: HeaderState = { isVisible: true, lastY: 0, turnY: 0, direction: 0 };

/** 스크롤 위치 하나를 받아 헤더 표시 상태를 한 걸음 갱신한다(순수 함수) */
export const stepHeaderVisibility = (state: HeaderState, scrollY: number): HeaderState => {
  if (scrollY <= HEADER.alwaysVisibleY) {
    return { isVisible: true, lastY: scrollY, turnY: scrollY, direction: 0 };
  }
  if (scrollY === state.lastY) return state;

  const direction = scrollY > state.lastY ? 1 : -1;
  // 방향이 바뀌면 직전 위치가 새 기준점이 된다
  const turnY = direction === state.direction ? state.turnY : state.lastY;

  let isVisible = state.isVisible;
  if (direction === 1 && scrollY - turnY >= HEADER.hideDistance) isVisible = false;
  if (direction === -1 && turnY - scrollY >= HEADER.showDistance) isVisible = true;

  return { isVisible, lastY: scrollY, turnY, direction };
};
