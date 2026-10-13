import { describe, expect, it } from "vitest";

import { PHONE_3D, SHARE_SCREEN, TIMELINE } from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computeShareB, computeShareScreen, shareButtonsScrollPx } from "./shareScene";

const H = 900;
const sections = stackSections({}, H);
const layout = computeStageLayout(1440, H);
const share = sections.find((section) => section.key === "share");
const ar = sections.find((section) => section.key === "ar");
if (!share || !ar) throw new Error("section not found");

const screen = { width: PHONE_3D.screen.width, height: PHONE_3D.screen.height };
const atP = (p: number, isReducedMotion = false): SceneFrame =>
  createFrame(share.top + p * (share.height - H), layout, sections, isReducedMotion);
const atArEndVh = (vh: number) => createFrame(ar.end + vh * H, layout, sections, false);

const { toggleTap, buttonsReveal, linkTap, qrModal, checkIn, checkOut, fromArBand } = TIMELINE.share;
const tapRange = (i: number): [number, number] => [
  toggleTap.start + i * toggleTap.stagger,
  toggleTap.start + i * toggleTap.stagger + toggleTap.duration,
];
const mid = ([a, b]: readonly [number, number]) => (a + b) / 2;

describe("computeShareScreen: AR → 기록 공유 화면", () => {
  it("밴드 전엔 0, share 섹션이 화면에 붙을 때(진행도 0) 이미 다 바뀌어 있다", () => {
    expect(computeShareScreen(atArEndVh(fromArBand[0] - 0.01), screen).enter).toBe(0);
    expect(computeShareScreen(atP(0), screen).enter).toBe(1);
  });
});

describe("computeShareScreen: 토글", () => {
  it("처음엔 모든 토글이 꺼져 있다", () => {
    expect(computeShareScreen(atP(0), screen).toggles).toEqual([0, 0, 0]);
  });

  it("시술 내용 → 만족도 → AR 후보 순서로 하나씩 눌러 켠다", () => {
    const afterFirst = computeShareScreen(atP(tapRange(0)[1]), screen);
    expect(afterFirst.toggles).toEqual([1, 0, 0]);
    const afterAll = computeShareScreen(atP(tapRange(2)[1]), screen);
    expect(afterAll.toggles).toEqual([1, 1, 1]);
  });

  it("누르는 중엔 그 토글 자리에 터치 표시가 있다(줄 중심 y·토글 x, 피그마 px)", () => {
    const tapping = computeShareScreen(atP(mid(tapRange(1))), screen);
    expect(tapping.tap.press).toBeGreaterThan(0.9);
    expect(tapping.tap.x).toBeCloseTo(SHARE_SCREEN.rows.toggleCenterX);
    const row = SHARE_SCREEN.toggledRows[1];
    expect(tapping.tap.y).toBeCloseTo(
      SHARE_SCREEN.fixedTop + SHARE_SCREEN.rows.firstCenterY + row * SHARE_SCREEN.rows.pitch,
    );
  });

  it("누르는 사이엔 터치 표시가 없다", () => {
    expect(computeShareScreen(atP(tapRange(0)[1] + 0.001), screen).tap.press).toBe(0);
  });
});

describe("computeShareScreen: 버튼 → 공유 링크 생성 → QR 모달", () => {
  it("버튼이 드러나도록 화면이 내려간다(버튼 아랫변이 탭바 위 여백에 닿음)", () => {
    expect(computeShareScreen(atP(buttonsReveal[0]), screen).scrollPx).toBe(0);
    const revealed = computeShareScreen(atP(buttonsReveal[1]), screen);
    expect(revealed.scrollPx).toBeCloseTo(shareButtonsScrollPx(screen));
    expect(shareButtonsScrollPx(screen)).toBeGreaterThan(0);
  });

  it("공유 링크 생성 버튼을 누른다(버튼 자리 터치 표시)", () => {
    const tapping = computeShareScreen(atP(mid(linkTap)), screen);
    expect(tapping.tap.press).toBeGreaterThan(0.9);
    expect(tapping.tap.x).toBeCloseTo(SHARE_SCREEN.buttons.linkCenterX);
    expect(tapping.linkPress).toBeGreaterThan(0.9);
  });

  it("그다음 QR 모달이 뜨고, 끝나면 모달·배경이 다 보인다", () => {
    expect(computeShareScreen(atP(qrModal[0]), screen).qr).toEqual({ bg: 0, modal: 0 });
    expect(computeShareScreen(atP(qrModal[1]), screen).qr).toEqual({ bg: 1, modal: 1 });
  });

  it("reduced motion이면 터치 없이 최종 상태(토글 켜짐·QR 모달)", () => {
    const scene = computeShareScreen(atP(0.5, true), screen);
    expect(scene.toggles).toEqual([1, 1, 1]);
    expect(scene.tap.press).toBe(0);
    expect(scene.qr).toEqual({ bg: 1, modal: 1 });
  });
});

describe("computeShareB: 폰 B 스캔 → 공유된 시술기록", () => {
  it("QR 비행이 끝난 뒤 공유된 시술기록이 열린다", () => {
    expect(TIMELINE.bScanToWebview[0]).toBeGreaterThanOrEqual(TIMELINE.qrFlight[1]);
    expect(computeShareB(atP(TIMELINE.qrFlight[1])).webview).toBe(0);
    expect(computeShareB(atP(TIMELINE.bScanToWebview[1])).webview).toBe(1);
  });

  it("체크 표시는 커지며 나타났다가 사라진다", () => {
    expect(computeShareB(atP(checkIn[0])).check.opacity).toBe(0);
    const shown = computeShareB(atP(checkIn[1]));
    expect(shown.check.opacity).toBe(1);
    expect(shown.check.scale).toBeCloseTo(1);
    expect(computeShareB(atP(checkOut[1])).check.opacity).toBe(0);
  });
});
