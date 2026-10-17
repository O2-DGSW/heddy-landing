import { afterEach, describe, expect, it } from "vitest";

import { getSeenScrollY, noteSeenScrollY, resetSeenScrollY } from "./seenScroll";

afterEach(() => resetSeenScrollY());

describe("seenScroll (지금까지 본 가장 아래 위치)", () => {
  it("가장 아래 위치만 기억하고 올라가도 줄지 않는다", () => {
    expect(getSeenScrollY()).toBe(0);
    noteSeenScrollY(1200);
    noteSeenScrollY(300);
    expect(getSeenScrollY()).toBe(1200);
  });
});
