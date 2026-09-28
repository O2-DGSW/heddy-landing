import { describe, expect, it } from "vitest";

import { resolveStoreUrl } from "./resolveStoreUrl";

const ENV = {
  APP_STORE_URL: "https://apps.apple.com/kr/app/id6700000000",
  ONE_STORE_URL: "https://onesto.re/0000799999",
};

describe("resolveStoreUrl", () => {
  it("아이폰은 App Store로 간다", () => {
    expect(resolveStoreUrl("ios", null, ENV)).toBe(ENV.APP_STORE_URL);
  });

  it("안드로이드는 원스토어로 간다", () => {
    expect(resolveStoreUrl("android", null, ENV)).toBe(ENV.ONE_STORE_URL);
  });

  it("?store= 지정이 OS 판별보다 우선한다", () => {
    expect(resolveStoreUrl("ios", "onestore", ENV)).toBe(ENV.ONE_STORE_URL);
    expect(resolveStoreUrl("android", "appstore", ENV)).toBe(ENV.APP_STORE_URL);
  });

  it("PC + store 지정 없음은 null이다", () => {
    expect(resolveStoreUrl("desktop", null, ENV)).toBeNull();
    expect(resolveStoreUrl("desktop", undefined, ENV)).toBeNull();
  });

  it("환경변수가 없거나 빈 문자열이면 null이다", () => {
    expect(resolveStoreUrl("ios", null, {})).toBeNull();
    expect(resolveStoreUrl("android", null, { ONE_STORE_URL: "" })).toBeNull();
  });

  it("모르는 store 값은 무시하고 OS로 판별한다", () => {
    expect(resolveStoreUrl("ios", "unknown", ENV)).toBe(ENV.APP_STORE_URL);
    expect(resolveStoreUrl("android", "unknown", ENV)).toBe(ENV.ONE_STORE_URL);
  });

  it("PC라도 store가 명시되면 그 스토어로 간다", () => {
    expect(resolveStoreUrl("desktop", "onestore", ENV)).toBe(ENV.ONE_STORE_URL);
  });
});
