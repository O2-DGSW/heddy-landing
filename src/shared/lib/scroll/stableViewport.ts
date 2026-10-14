import { STABLE_VIEWPORT } from "@/shared/config";

export type ViewportSize = { width: number; height: number };

/**
 * 레이아웃에 쓸 뷰포트 크기(이슈 #50). 모바일 브라우저는 스크롤할 때 주소창이 접히고 펴지며 innerHeight가
 * 바뀌는데, 그대로 쓰면 폰 크기·자리가 출렁인다. 터치 기기에서 폭이 같고 높이 변화가 주소창 정도면 이전 높이를 쓴다.
 */
export const stableViewportSize = (
  prev: ViewportSize | null,
  next: ViewportSize,
  isTouch: boolean,
): ViewportSize => {
  if (!prev || !isTouch || prev.width !== next.width) return next;
  if (Math.abs(next.height - prev.height) <= STABLE_VIEWPORT.toolbarSlackPx) return prev;
  return next;
};
