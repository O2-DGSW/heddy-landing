import { describe, expect, it } from "vitest";

import { INITIAL_HEADER_STATE, consumeHeaderScroll, settleHeaderOffset, stepHeaderOffset, type HeaderState } from "./headerVisibility";

const H = 68;

/** 스크롤 위치를 차례로 넣어 마지막 상태를 돌려준다 */
const scrollThrough = (positions: readonly number[], from: HeaderState = INITIAL_HEADER_STATE): HeaderState =>
  positions.reduce((state, y) => stepHeaderOffset(state, y, H), from);

/** 해당 위치에 멈춰 있는 상태(0→위치 점프를 한 번의 큰 이동으로 세지 않게) */
const restingAt = (y: number, offset = 0): HeaderState => ({ lastY: y, offset });

describe("stepHeaderOffset", () => {
  it("처음에는 완전히 보인다(오프셋 0)", () => {
    expect(INITIAL_HEADER_STATE.offset).toBe(0);
  });

  it("아래로 스크롤한 양만큼 헤더가 위로 밀려 올라간다", () => {
    expect(scrollThrough([410], restingAt(400)).offset).toBe(10);
    expect(scrollThrough([410, 430], restingAt(400)).offset).toBe(30);
  });

  it("헤더 높이만큼만 올라가고 그 뒤로는 더 올라가지 않는다(숨김 유지)", () => {
    expect(scrollThrough([400 + H, 400 + H + 500], restingAt(400)).offset).toBe(H);
  });

  it("위로 스크롤한 양만큼 헤더가 내려온다", () => {
    expect(scrollThrough([700 - 20], restingAt(700, H)).offset).toBe(H - 20);
  });

  it("위로 헤더 높이만큼 올리면 완전히 보인다", () => {
    expect(scrollThrough([700 - H, 100], restingAt(700, H)).offset).toBe(0);
  });

  it("방향이 바뀌면 그 자리에서 바로 따라 움직인다(기준점 지연 없음)", () => {
    const down = scrollThrough([440], restingAt(400)); // 40만큼 숨김
    expect(down.offset).toBe(40);
    expect(scrollThrough([430], down).offset).toBe(30);
  });

  it("맨 위로 돌아가면 완전히 보인다", () => {
    const hidden = scrollThrough([1000], restingAt(400));
    expect(hidden.offset).toBe(H);
    expect(scrollThrough([0], hidden).offset).toBe(0);
  });

  it("iOS 바운스 같은 음수 스크롤도 완전히 보이는 상태로 처리한다", () => {
    expect(scrollThrough([400, 800, -20]).offset).toBe(0);
  });

  it("스크롤이 멈추면(같은 위치) 오프셋을 바꾸지 않는다", () => {
    const state = restingAt(500, 25);
    expect(scrollThrough([500, 500], state)).toEqual(state);
  });

  it("헤더 높이가 0이면(측정 전) 항상 0이다", () => {
    expect(stepHeaderOffset(restingAt(400), 900, 0).offset).toBe(0);
  });
});

describe("consumeHeaderScroll", () => {
  it("아래로 스크롤하면 헤더가 먼저 올라가고, 그동안 화면은 스크롤되지 않는다(남는 양 0)", () => {
    const result = consumeHeaderScroll(restingAt(0), 30, H);
    expect(result.state.offset).toBe(30);
    expect(result.remainder).toBe(0);
  });

  it("헤더가 다 숨는 순간 남는 양만 화면 스크롤로 넘긴다", () => {
    const result = consumeHeaderScroll(restingAt(0, 50), 100, H);
    expect(result.state.offset).toBe(H);
    expect(result.remainder).toBe(100 - (H - 50));
  });

  it("이미 숨어 있으면 전부 화면 스크롤로 넘긴다", () => {
    const result = consumeHeaderScroll(restingAt(500, H), 40, H);
    expect(result.state.offset).toBe(H);
    expect(result.remainder).toBe(40);
  });

  it("위로 스크롤은 헤더가 가로채지 않는다(그대로 화면 스크롤)", () => {
    const state = restingAt(500, H);
    expect(consumeHeaderScroll(state, -40, H)).toEqual({ state, remainder: -40 });
  });

  it("헤더 높이가 0이면(측정 전) 가로채지 않는다", () => {
    const state = restingAt(0);
    expect(consumeHeaderScroll(state, 40, 0)).toEqual({ state, remainder: 40 });
  });
});

describe("settleHeaderOffset", () => {
  it("스크롤이 멈췄을 때 절반 넘게 숨어 있으면 마저 숨긴다", () => {
    expect(settleHeaderOffset(restingAt(500, H / 2 + 1), H).offset).toBe(H);
  });

  it("절반 이하로 숨어 있으면 다시 완전히 보인다", () => {
    expect(settleHeaderOffset(restingAt(500, H / 2), H).offset).toBe(0);
    expect(settleHeaderOffset(restingAt(500, 5), H).offset).toBe(0);
  });

  it("이미 완전히 보이거나 숨었으면 그대로다", () => {
    const shown = restingAt(500, 0);
    const hidden = restingAt(500, H);
    expect(settleHeaderOffset(shown, H)).toBe(shown);
    expect(settleHeaderOffset(hidden, H)).toBe(hidden);
  });
});
