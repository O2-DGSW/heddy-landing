import { describe, expect, it } from "vitest";

import { SECTION_KEYS } from "@/shared/config";

import { MOBILE_SECTIONS } from "./mobileSections";

describe("MOBILE_SECTIONS (모바일 쌓기 구성, 이슈 #52)", () => {
  it("데스크톱과 같은 흐름: 섹션 순서가 SECTION_KEYS와 같다", () => {
    expect(MOBILE_SECTIONS.map((section) => section.key)).toEqual([...SECTION_KEYS]);
  });

  it("섹션마다 보여 줄 화면이 하나씩 있다", () => {
    MOBILE_SECTIONS.forEach((section) => expect(section.visual).toBeDefined());
  });

  it("AR 섹션은 데스크톱 다크 패널처럼 어두운 톤이다", () => {
    expect(MOBILE_SECTIONS.find((section) => section.key === "ar")?.tone).toBe("dark");
    expect(MOBILE_SECTIONS.filter((section) => section.tone === "dark")).toHaveLength(1);
  });

  it("공유는 폰 두 대(보내는 QR · 받은 기록)를 나란히 보여 준다", () => {
    const share = MOBILE_SECTIONS.find((section) => section.key === "share");
    expect(share?.visual.kind).toBe("pair");
  });
});
