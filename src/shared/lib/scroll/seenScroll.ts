/**
 * 지금까지 본 가장 아래 스크롤 위치(이슈 #89). 프레임(`ScrollSceneProvider`)이 기록하고, 전환 시간표
 * (`useFullpageScroll`)가 이미 본 도착 모션을 0초로 건너뛸 때 읽는다.
 */
let seenScrollY = 0;

export const getSeenScrollY = (): number => seenScrollY;

export const noteSeenScrollY = (scrollY: number): number => {
  seenScrollY = Math.max(seenScrollY, scrollY);
  return seenScrollY;
};

export const resetSeenScrollY = (): void => {
  seenScrollY = 0;
};
