import { describe, expect, it } from "vitest";

import { detectPlatform } from "./detectPlatform";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const IPHONE_KAKAOTALK =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.5";
const GALAXY_CHROME =
  "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const GALAXY_SAMSUNG_INTERNET =
  "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/115.0.0.0 Mobile Safari/537.36";
const GALAXY_NAVER_INAPP =
  "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.5.0)";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

describe("detectPlatform", () => {
  it("아이폰 사파리·카톡 인앱은 ios다", () => {
    expect(detectPlatform(IPHONE_SAFARI)).toBe("ios");
    expect(detectPlatform(IPHONE_KAKAOTALK)).toBe("ios");
  });

  it("갤럭시 크롬·삼성인터넷·네이버 인앱은 android다", () => {
    expect(detectPlatform(GALAXY_CHROME)).toBe("android");
    expect(detectPlatform(GALAXY_SAMSUNG_INTERNET)).toBe("android");
    expect(detectPlatform(GALAXY_NAVER_INAPP)).toBe("android");
  });

  it("Mac·Windows·null은 desktop이다", () => {
    expect(detectPlatform(MAC_SAFARI)).toBe("desktop");
    expect(detectPlatform(WINDOWS_CHROME)).toBe("desktop");
    expect(detectPlatform(null)).toBe("desktop");
    expect(detectPlatform(undefined)).toBe("desktop");
  });
});
