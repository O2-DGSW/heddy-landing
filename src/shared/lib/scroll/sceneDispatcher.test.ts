import { describe, expect, it } from "vitest";

import { createFrame } from "./sceneFrame";
import { createSceneDispatcher } from "./sceneDispatcher";
import { computeStageLayout, stackSections } from "./stageLayout";

const layout = computeStageLayout(1512, 982);
const sections = stackSections({}, 982);
const frameAt = (scrollY: number, reduced = false) => createFrame(scrollY, layout, sections, reduced);

describe("공통 프레임 처리", () => {
  it("DOM과 보간 갱신이 끝난 뒤 캔버스를 한 번만 그린다", () => {
    const dispatcher = createSceneDispatcher();
    const order: string[] = [];
    dispatcher.subscribe(() => order.push("dom"));
    dispatcher.subscribeSmooth(() => order.push("smooth"), 90);
    dispatcher.subscribeAfterFrame(() => order.push("canvas"));
    dispatcher.emit(frameAt(0), 0);
    expect(order).toEqual(["dom", "smooth", "canvas"]);
  });

  it("같은 반감기의 구독자는 같은 보간 위치를 받고 정지 후에도 목표를 따라잡는다", () => {
    const dispatcher = createSceneDispatcher();
    const first: number[] = [];
    const second: number[] = [];
    dispatcher.subscribeSmooth((frame) => first.push(frame.scrollY), 90);
    dispatcher.subscribeSmooth((frame) => second.push(frame.scrollY), 90);
    dispatcher.emit(frameAt(0), 0);
    expect(dispatcher.emit(frameAt(1000), 16)).toBe(true);
    for (let time = 32; time <= 2000; time += 16) dispatcher.emit(frameAt(1000), time);
    expect(first).toEqual(second);
    expect(first.at(-1)).toBe(1000);
    expect(dispatcher.emit(frameAt(1000), 2016)).toBe(false);
  });

  it("구독 해제와 동작 줄이기에서는 불필요한 보간을 남기지 않는다", () => {
    const dispatcher = createSceneDispatcher();
    const stop = dispatcher.subscribeSmooth(() => undefined, 90);
    dispatcher.emit(frameAt(0), 0);
    expect(dispatcher.emit(frameAt(1000, true), 16)).toBe(false);
    stop();
    expect(dispatcher.emit(frameAt(2000), 32)).toBe(false);
  });
});

describe("부드럽게 따라가는 프레임의 본 결과 유지(이슈 #89)", () => {
  it("처음 내려갈 땐 보간 위치 기준이라 앞서 간 실제 위치로 건너뛰지 않는다", () => {
    const dispatcher = createSceneDispatcher();
    const seen: number[] = [];
    const ys: number[] = [];
    dispatcher.subscribeSmooth((frame) => {
      seen.push(frame.seenScrollY);
      ys.push(frame.scrollY);
    }, 90);
    dispatcher.emit(frameAt(0), 0);
    dispatcher.emit(createFrame(1000, layout, sections, false, 1000), 16);
    expect(ys.at(-1)).toBeLessThan(1000);
    expect(seen.at(-1)).toBe(ys.at(-1));
  });

  it("다시 올라갈 땐 보간 프레임도 본 가장 아래 위치를 기억한다", () => {
    const dispatcher = createSceneDispatcher();
    const seen: number[] = [];
    dispatcher.subscribeSmooth((frame) => seen.push(frame.seenScrollY), 90);
    dispatcher.emit(frameAt(0), 0);
    for (let time = 16; time <= 2000; time += 16) dispatcher.emit(frameAt(3000), time);
    for (let time = 2016; time <= 4000; time += 16)
      dispatcher.emit(createFrame(500, layout, sections, false, 3000), time);
    expect(seen.at(-1)).toBe(3000);
  });
});
