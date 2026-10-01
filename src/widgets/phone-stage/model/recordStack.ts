import { computeRecordSteps } from "@/entities/record";
import { RECORD_STACK, TIMELINE } from "@/shared/config";
import { clamp, easeInOutCubic, lerp, progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

/** RecordRig 회전(도). 폰 A(정면 합체 상태) 위에 더해진다 */
export type RecordRig = {
  rotX: number;
  rotY: number;
  rotZ: number;
  /** 뒷면을 지난 뒤(rotY ≥ 180)면 홈 대신 기록 화면을 보인다 */
  isRecordScreen: boolean;
};

/** 카드 한 장. x·y는 화면 좌표(좌상단 원점, y 아래로)의 카드 중심, z는 화면에서 앞으로 뜬 거리 */
export type RecordCardPose = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scaleX: number;
  scaleY: number;
  isVisible: boolean;
};

export type RecordStackScene = {
  rig: RecordRig;
  cards: RecordCardPose[];
  /** 흐림 막 불투명도(0~veilAlpha) */
  veil: number;
};

const getRecordTop = (frame: SceneFrame): number =>
  frame.sections.find((section) => section.key === "record")?.top ?? 0;

/** 도 단위 각을 (-180, 180]으로 */
const normalizeDeg = (deg: number): number => {
  const mod = (((deg + 180) % 360) + 360) % 360;
  return mod === 0 ? 180 : mod - 180;
};

/**
 * record 진입 때 폰이 한 바퀴(360 + tiltY) 돌며 이미지 2 각도로 기울고,
 * 12건이 다 쌓이면(settle) 정면(360)으로 돌아온다.
 */
export const computeRecordRig = (frame: SceneFrame, settle: number): RecordRig => {
  if (frame.isReducedMotion) return { rotX: 0, rotY: 0, rotZ: 0, isRecordScreen: true };

  const { tiltPose } = RECORD_STACK;
  const vh = frame.layout.viewportHeight;
  const top = getRecordTop(frame);
  const [spinStart, spinEnd] = TIMELINE.record.spinVh;
  const spin = easeInOutCubic(progressIn(frame.scrollY, [top + spinStart * vh, top + spinEnd * vh]));
  const turn = 360 + tiltPose.rotY;
  const tilt = spin * (1 - settle);
  const rotY = spin * turn + settle * (360 - turn);

  return {
    rotX: tiltPose.rotX * tilt,
    rotY,
    rotZ: tiltPose.rotZ * tilt,
    isRecordScreen: rotY >= 180,
  };
};

/** 등장 진행도(entered)·settle·리그 요(yaw)로 카드 자세를 낸다 */
const layoutRecordCards = (
  entered: readonly number[],
  settle: number,
  rigYawFromFront: number,
): RecordCardPose[] => {
  const { listTop, card, slotGap, clipBottom, pop, enterScaleFrom, screen } = RECORD_STACK;

  return entered.map((enter, index): RecordCardPose => {
    const slot = entered.slice(index + 1).reduce((sum, value) => sum + value, 0);
    const next = index + 1 < entered.length ? entered[index + 1] : settle;
    const popped = enter * (1 - next);

    const top = listTop + slot * slotGap;
    // 네비 뒤로 들어가는 카드는 clipBottom을 넘는 만큼만 잘라낸다(보이는 부분은 네비가 덮으므로 찌그러짐이 안 보인다)
    const collapse = clamp((top + card.height - clipBottom) / card.height);
    const scaleY = 1 - collapse;
    const grow = lerp(enterScaleFrom, 1, enter) * lerp(1, pop.scale, popped);

    return {
      x: screen.width / 2 + pop.x * popped,
      y: top + (card.height * scaleY) / 2,
      z: pop.z * popped,
      rotY: -pop.faceCamera * rigYawFromFront * popped,
      scaleX: grow,
      scaleY: scaleY * grow,
      isVisible: enter > 0 && scaleY > 0,
    };
  });
};

/**
 * 기록 카드 스택(`docs/plans/0004`). 새 기록은 리스트 맨 위(slot 0)에 작게 나타나 커지며
 * 화면 밖으로 튀어나오고(pop), 다음 기록이 오면 제자리로 내려앉으며 한 칸 밀린다.
 * 네비에 닿는 카드는 윗변을 고정한 채 접혀 사라진다.
 */
export const computeRecordStack = (frame: SceneFrame, count: number): RecordStackScene => {
  const steps = computeRecordSteps(frame, count);
  const rig = computeRecordRig(frame, steps.settle);
  const cards = layoutRecordCards(steps.entered, steps.settle, normalizeDeg(rig.rotY));
  const veil = frame.isReducedMotion
    ? 0
    : RECORD_STACK.veilAlpha * (steps.entered[0] ?? 0) * (1 - steps.settle);

  return { rig, cards, veil };
};

/** 12건이 다 쌓이고 내려앉은 마지막 상태 — 3D에서 넘겨받는 CSS 폰 기록 화면이 그대로 그린다 */
export const computeSettledRecordCards = (count: number): RecordCardPose[] =>
  layoutRecordCards(
    Array.from({ length: count }, () => 1),
    1,
    0,
  );
