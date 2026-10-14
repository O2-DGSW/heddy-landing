import { describe, expect, it } from "vitest";

import { downloadUrl } from "@/shared/config";

import { isLandingEntry } from "./resolveDownloadEntry";

describe("명함 QR(이미 인쇄됨, 이슈 #48)", () => {
  it("인쇄된 주소는 바뀌지 않는다: https://heddy.site/download?src=header", () => {
    expect(downloadUrl("header")).toBe("https://heddy.site/download?src=header");
  });

  it("store가 없으면(명함 QR) 랜딩페이지로 보낸다", () => {
    expect(isLandingEntry(undefined)).toBe(true);
    expect(isLandingEntry(null)).toBe(true);
    expect(isLandingEntry("")).toBe(true);
  });

  it("사이트 QR(store=auto)과 스토어 버튼(appstore·onestore)은 스토어로 간다", () => {
    expect(isLandingEntry("auto")).toBe(false);
    expect(isLandingEntry("appstore")).toBe(false);
    expect(isLandingEntry("onestore")).toBe(false);
  });

  it("사이트 QR 주소는 store=auto를 붙인다", () => {
    expect(downloadUrl("header", "auto")).toBe("https://heddy.site/download?src=header&store=auto");
  });
});
