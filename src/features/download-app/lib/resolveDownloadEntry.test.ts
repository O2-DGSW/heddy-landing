import { describe, expect, it } from "vitest";

import { downloadUrl, MOBILE_WEB_PATH } from "@/shared/config";

import { ipadDownloadHref, isLandingEntry, resolveDownloadDestination } from "./resolveDownloadEntry";

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

describe("다운로드 목적지(스토어 출시 전엔 모바일 웹, 이슈 #98)", () => {
  const NONE = {};
  const RELEASED = {
    APP_STORE_URL: "https://apps.example/heddy",
    ONE_STORE_URL: "https://onestore.example/heddy",
  };

  it("명함 QR(store 없음)은 어떤 기기든 랜딩", () => {
    expect(resolveDownloadDestination("ios", undefined, RELEASED)).toEqual({ kind: "redirect", url: "/" });
    expect(resolveDownloadDestination("desktop", null, NONE)).toEqual({ kind: "redirect", url: "/" });
  });

  it("스토어 링크가 없으면 휴대폰은 모바일 웹으로(QR·헤더 버튼·스토어 버튼 모두)", () => {
    for (const platform of ["ios", "android"] as const) {
      for (const store of ["auto", "appstore", "onestore"]) {
        expect(resolveDownloadDestination(platform, store, NONE)).toEqual({
          kind: "redirect",
          url: MOBILE_WEB_PATH,
        });
      }
    }
    expect(MOBILE_WEB_PATH).toBe("/mobile");
  });

  it("스토어 링크가 없으면 PC에서 누른 App Store·원스토어 버튼도 모바일 웹으로", () => {
    expect(resolveDownloadDestination("desktop", "appstore", NONE)).toEqual({
      kind: "redirect",
      url: MOBILE_WEB_PATH,
    });
    expect(resolveDownloadDestination("desktop", "onestore", NONE)).toEqual({
      kind: "redirect",
      url: MOBILE_WEB_PATH,
    });
  });

  it("PC의 사이트 QR 주소(store=auto)는 QR 페이지(휴대폰으로 찍으면 모바일 웹)", () => {
    expect(resolveDownloadDestination("desktop", "auto", NONE)).toEqual({ kind: "qr" });
  });

  it("링크가 생기면 코드 수정 없이 스토어로 간다", () => {
    expect(resolveDownloadDestination("ios", "auto", RELEASED)).toEqual({
      kind: "redirect",
      url: RELEASED.APP_STORE_URL,
    });
    expect(resolveDownloadDestination("android", "auto", RELEASED)).toEqual({
      kind: "redirect",
      url: RELEASED.ONE_STORE_URL,
    });
    expect(resolveDownloadDestination("desktop", "onestore", RELEASED)).toEqual({
      kind: "redirect",
      url: RELEASED.ONE_STORE_URL,
    });
  });

  it("한쪽 스토어만 나오면 다른 쪽 휴대폰은 모바일 웹", () => {
    const iosOnly = { APP_STORE_URL: RELEASED.APP_STORE_URL };
    expect(resolveDownloadDestination("android", "auto", iosOnly)).toEqual({
      kind: "redirect",
      url: MOBILE_WEB_PATH,
    });
  });

  it("iPad(데스크톱 UA)는 App Store 링크가 없으면 모바일 웹 — QR 페이지와 무한 반복 방지", () => {
    expect(ipadDownloadHref(NONE)).toBe(MOBILE_WEB_PATH);
    expect(ipadDownloadHref(RELEASED)).toBe("/download?src=ipad&store=appstore");
  });
});
