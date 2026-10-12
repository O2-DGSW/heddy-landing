import { describe, expect, it } from "vitest";

import { INITIAL_HEADER_STATE, stepHeaderOffset, type HeaderState } from "./headerVisibility";

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
