import { describe, expect, it } from "vitest";

import { RECORD_STACK, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeRecordStack, computeSettledRecordCards } from "./recordStack";

const COUNT = 12;

const viewport = (width = 1440, height = 900) => {
  const sections = stackSections({}, height);
  const layout = computeStageLayout(width, height);
  const record = sections.find((section) => section.key === "record");
  if (!record) throw new Error("record not found");
  const at = (scrollY: number, isReducedMotion = false): SceneFrame =>
    createFrame(scrollY, layout, sections, isReducedMotion);
  const atP = (p: number): SceneFrame => at(record.top + p * (record.height - height));
  const atSpin = (t: number): SceneFrame => {
    const [start, end] = TIMELINE.record.spinVh;
    return at(record.top + (start + (end - start) * t) * height);
  };
  return { at, atP, atSpin, record };
};

/** 스텝 k 안의 로컬 진행도 u에 해당하는 record 진행도 */
const pAtStep = (k: number, u: number): number => {
  const [start, end] = TIMELINE.record.band;
  return start + ((k + u) / COUNT) * (end - start);
};

const normalize = (deg: number) => ((deg % 360) + 360) % 360;

describe("computeRecordStack — 폰 자세(RecordRig)", () => {
  it("record 스핀 전에는 정면 그대로이고 홈 화면이다", () => {
    const { at, record } = viewport();
    const { rig, cards, veil } = computeRecordStack(at(record.top - 0.9 * 900), COUNT);
    expect(rig.rotX).toBeCloseTo(0);
    expect(rig.rotY).toBeCloseTo(0);
    expect(rig.rotZ).toBeCloseTo(0);
    expect(rig.isRecordScreen).toBe(false);
    expect(cards.every((card) => !card.isVisible)).toBe(true);
    expect(veil).toBe(0);
  });

  it("한 바퀴 도는 중 뒷면(180°)을 지날 때 기록 화면으로 바뀐다", () => {
    const { atSpin } = viewport();
    const before = computeRecordStack(atSpin(0.4), COUNT).rig;
    const after = computeRecordStack(atSpin(0.6), COUNT).rig;
    expect(before.rotY).toBeLessThan(180);
    expect(before.isRecordScreen).toBe(false);
    expect(after.rotY).toBeGreaterThanOrEqual(180);
    expect(after.isRecordScreen).toBe(true);
  });

  it("스핀이 끝나면 이미지 2 각도(tiltPose)로 기울어 있다", () => {
    const { atSpin } = viewport();
    const { rig } = computeRecordStack(atSpin(1), COUNT);
    const { tiltPose } = RECORD_STACK;
    expect(rig.rotX).toBeCloseTo(tiltPose.rotX);
    expect(normalize(rig.rotY)).toBeCloseTo(normalize(tiltPose.rotY));
    expect(rig.rotZ).toBeCloseTo(tiltPose.rotZ);
  });

  it("record 끝(settle)에서 다시 정면이다 — CSS 폰으로 이음새 없이 넘긴다", () => {
    const { atP } = viewport();
    const { rig, cards, veil } = computeRecordStack(atP(1), COUNT);
    expect(rig.rotX).toBeCloseTo(0);
    expect(normalize(rig.rotY)).toBeCloseTo(0);
    expect(rig.rotZ).toBeCloseTo(0);
    expect(cards.every((card) => card.z === 0)).toBe(true);
    expect(veil).toBe(0);
  });
});

describe("computeRecordStack — 카드", () => {
  it("스텝 k가 끝나면 최신 기록만 튀어나와 있고 맨 위(slot 0)에 있다", () => {
    const { atP } = viewport();
    const { listTop, card, slotGap, pop } = RECORD_STACK;
    for (const k of [0, 1, 5]) {
      const { cards } = computeRecordStack(atP(pAtStep(k, 0.8)), COUNT);
      const latest = cards[k];
      expect(latest.z).toBeCloseTo(pop.z);
      expect(latest.x).toBeCloseTo(RECORD_STACK.screen.width / 2 + pop.x);
      expect(latest.y).toBeCloseTo(listTop + card.height / 2);
      for (let index = 0; index < k; index += 1) {
        expect(cards[index].z).toBe(0);
        // 오래된 기록일수록 아래: slot = k - index
        const top = listTop + (k - index) * slotGap;
        if (cards[index].isVisible && top + card.height <= RECORD_STACK.navTop) {
          expect(cards[index].y).toBeCloseTo(top + card.height / 2);
        }
      }
      expect(cards.slice(k + 1).every((future) => !future.isVisible)).toBe(true);
    }
  });

  it("새 카드는 옆면(spinInDeg)에서 돌며 들어온다", () => {
    const { atP } = viewport();
    const entering = computeRecordStack(atP(pAtStep(3, 0.02)), COUNT).cards[3];
    expect(entering.isVisible).toBe(true);
    expect(entering.rotY).toBeGreaterThan(RECORD_STACK.spinInDeg * 0.9);
  });

  it("튀어나온 카드는 기울어진 폰과 반대로 돌아 카메라 쪽을 본다", () => {
    const { atP } = viewport();
    const latest = computeRecordStack(atP(pAtStep(2, 0.8)), COUNT).cards[2];
    const expected = -RECORD_STACK.pop.faceCamera * RECORD_STACK.tiltPose.rotY;
    expect(latest.rotY).toBeCloseTo(expected);
  });

  it("다음 기록이 들어오면 이전 카드는 제자리로 내려앉는다", () => {
    const { atP } = viewport();
    const { cards } = computeRecordStack(atP(pAtStep(4, 0.8)), COUNT);
    expect(cards[3].z).toBe(0);
    expect(cards[3].rotY).toBeCloseTo(0);
  });

  it("보이는 카드는 하단 네비를 넘지 않는다(닿으면 접혀 사라진다)", () => {
    const { atP } = viewport();
    for (let step = 0; step <= 60; step += 1) {
      const { cards } = computeRecordStack(atP(step / 60), COUNT);
      for (const card of cards.filter((candidate) => candidate.isVisible && candidate.z === 0)) {
        expect(card.y + (RECORD_STACK.card.height * card.scaleY) / 2).toBeLessThanOrEqual(
          RECORD_STACK.navTop + 1e-6,
        );
      }
    }
  });

  it("12건이 다 쌓이면 가장 오래된 기록은 네비 아래로 사라져 있다", () => {
    const { atP } = viewport();
    const { cards } = computeRecordStack(atP(TIMELINE.record.band[1]), COUNT);
    expect(cards[0].isVisible).toBe(false);
    expect(cards[COUNT - 1].isVisible).toBe(true);
  });

  it("뷰포트가 달라도 같은 진행도에서 같은 카드 자세다", () => {
    const base = computeRecordStack(viewport().atP(pAtStep(7, 0.3)), COUNT);
    for (const [width, height] of [
      [1920, 1080],
      [1024, 700],
    ] as const) {
      const other = computeRecordStack(viewport(width, height).atP(pAtStep(7, 0.3)), COUNT);
      other.cards.forEach((card, index) => {
        expect(card.y).toBeCloseTo(base.cards[index].y);
        expect(card.z).toBeCloseTo(base.cards[index].z);
      });
    }
  });

  it("reduced motion이면 정면에 12건이 쌓인 최종 상태다", () => {
    const { at } = viewport();
    const { rig, cards, veil } = computeRecordStack(at(0, true), COUNT);
    expect(rig.rotY).toBe(0);
    expect(rig.isRecordScreen).toBe(true);
    expect(cards[COUNT - 1].isVisible).toBe(true);
    expect(cards.every((card) => card.z === 0)).toBe(true);
    expect(veil).toBe(0);
  });
});

describe("computeSettledRecordCards", () => {
  it("record 끝(3D에서 CSS 폰으로 넘기는 순간)의 카드 배치와 같다", () => {
    const { cards } = computeRecordStack(viewport().atP(1), COUNT);
    const settled = computeSettledRecordCards(COUNT);
    settled.forEach((card, index) => {
      expect(card.isVisible).toBe(cards[index].isVisible);
      if (!card.isVisible) return;
      expect(card.x).toBeCloseTo(cards[index].x);
      expect(card.y).toBeCloseTo(cards[index].y);
      expect(card.scaleY).toBeCloseTo(cards[index].scaleY);
    });
  });
});
