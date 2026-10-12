import { describe, expect, it } from "vitest";

import { HEADER } from "@/shared/config";

import { INITIAL_HEADER_STATE, stepHeaderVisibility, type HeaderState } from "./headerVisibility";

/** 스크롤 위치를 차례로 넣어 마지막 상태를 돌려준다 */
const scrollThrough = (positions: readonly number[], from: HeaderState = INITIAL_HEADER_STATE): HeaderState =>
  positions.reduce(stepHeaderVisibility, from);

/** 해당 위치에 멈춰 있는 상태(점프로 시작하면 0→위치가 한 번의 큰 이동으로 센다) */
const restingAt = (y: number): HeaderState => ({ ...INITIAL_HEADER_STATE, lastY: y, turnY: y });

describe("stepHeaderVisibility", () => {
  it("처음에는 보인다", () => {
    expect(INITIAL_HEADER_STATE.isVisible).toBe(true);
  });

  it("맨 위 근처에서는 아래로 스크롤해도 숨기지 않는다", () => {
    expect(scrollThrough([0, HEADER.alwaysVisibleY]).isVisible).toBe(true);
  });

  it("아래로 hideDistance만큼 내려가면 숨긴다", () => {
    const start = 400;
    expect(scrollThrough([start + HEADER.hideDistance - 1], restingAt(start)).isVisible).toBe(true);
    expect(scrollThrough([start + HEADER.hideDistance], restingAt(start)).isVisible).toBe(false);
  });

  it("조금씩 여러 프레임에 걸쳐 내려가도 누적되어 숨긴다", () => {
    const steps = Array.from({ length: 30 }, (_, i) => 400 + i * 2);
    expect(scrollThrough(steps.slice(1), restingAt(400)).isVisible).toBe(false);
  });

  it("숨은 뒤 위로 showDistance만큼 올리면 다시 보인다", () => {
    const hidden = scrollThrough([400, 400 + HEADER.hideDistance + 100]);
    expect(hidden.isVisible).toBe(false);
    const peak = 400 + HEADER.hideDistance + 100;
    expect(scrollThrough([peak - HEADER.showDistance + 1], hidden).isVisible).toBe(false);
    expect(scrollThrough([peak - HEADER.showDistance], hidden).isVisible).toBe(true);
  });

  it("보이는 상태에서 위로 올리면 계속 보인다", () => {
    expect(scrollThrough([600, 500, 400]).isVisible).toBe(true);
  });

  it("맨 위로 돌아가면 방향과 상관없이 보인다", () => {
    const hidden = scrollThrough([400, 800]);
    expect(hidden.isVisible).toBe(false);
    expect(scrollThrough([HEADER.alwaysVisibleY], hidden).isVisible).toBe(true);
  });

  it("스크롤이 멈추면(같은 위치) 상태를 바꾸지 않는다", () => {
    const hidden = scrollThrough([400, 800]);
    expect(scrollThrough([800, 800, 800], hidden).isVisible).toBe(false);
  });

  it("방향이 바뀌면 그 지점부터 다시 센다", () => {
    // 숨긴 뒤 조금 올렸다가(보이기 전) 다시 내려가도 숨김 유지
    const hidden = scrollThrough([400, 800]);
    expect(scrollThrough([795, 800, 900], hidden).isVisible).toBe(false);
  });

  it("iOS 바운스 같은 음수 스크롤도 보이는 상태로 처리한다", () => {
    expect(scrollThrough([400, 800, -20]).isVisible).toBe(true);
  });
});
