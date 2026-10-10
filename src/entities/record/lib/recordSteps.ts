import { TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

export type RecordSteps = {
  /** 1~count: 지금까지 추가된 기록 수(연속값). 첫 기록은 처음부터 있고, 스텝 k(1~) = raw ∈ [k, k+1] */
  raw: number;
  /** 기록 i(오래된 순)의 등장 진행도(0~1, 이징 적용) */
  entered: number[];
  /** 가장 최근에 추가되기 시작한 기록 index (아직 없으면 0) */
  focusIndex: number;
  /** 마지막 카드가 내려앉고 폰이 정면으로 돌아오는 진행도(0~1, 이징 적용) */
  settle: number;
};

/**
 * record 섹션에서 기록이 한 건씩 추가되는 스텝(`docs/plans/0004`). 폰 카드 스택과
 * 좌측 큰 날짜가 같은 값을 쓰도록 여기 한 곳에서 계산한다.
 */
export const computeRecordSteps = (frame: SceneFrame, count: number): RecordSteps => {
  if (frame.isReducedMotion) {
    return { raw: count, entered: Array.from({ length: count }, () => 1), focusIndex: count - 1, settle: 1 };
  }

  const p = frame.progress("record");
  // 첫 기록은 기록 화면이 뜰 때부터 있고(빈 목록 없음), 나머지가 band에 고르게 한 건씩 들어온다
  const raw = 1 + progressIn(p, TIMELINE.record.band) * (count - 1);
  const entered = Array.from({ length: count }, (_, index) =>
    easeInOutCubic(progressIn(raw - index, [0, TIMELINE.record.stepEnter])),
  );
  const focusIndex = Math.min(count - 1, Math.max(0, Math.ceil(raw) - 1));
  const settle = easeInOutCubic(progressIn(p, TIMELINE.record.settle));

  return { raw, entered, focusIndex, settle };
};
