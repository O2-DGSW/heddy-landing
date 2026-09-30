import { TIMELINE } from "@/shared/config";
import { easeInOutCubic, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

export type RecordSteps = {
  /** 0~count: 지금까지 추가된 기록 수(연속값). 스텝 k = raw ∈ [k, k+1] */
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
  const raw = progressIn(p, TIMELINE.record.band) * count;
  const entered = Array.from({ length: count }, (_, index) =>
    easeInOutCubic(progressIn(raw - index, [0, TIMELINE.record.stepEnter])),
  );
  const focusIndex = Math.min(count - 1, Math.max(0, Math.ceil(raw) - 1));
  const settle = easeInOutCubic(progressIn(p, TIMELINE.record.settle));

  return { raw, entered, focusIndex, settle };
};
