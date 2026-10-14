import { describe, expect, it } from "vitest";

import {
  CLOSING_PHONE,
  PHONE,
  PHONE_3D,
  SECTION_HEIGHT_VH,
  SECTION_KEYS,
  SHARE_SCREEN,
  TIMELINE,
  type SectionKey,
} from "@/shared/config";
import { computeStageLayout, createFrame, stackSections, type SceneFrame } from "@/shared/lib/scroll";

import { computePhones, computeScreens } from "./scene";

const W = 1440;
const H = 900;

const heightsPx = Object.fromEntries(
  SECTION_KEYS.map((key) => [key, (SECTION_HEIGHT_VH[key] / 100) * H]),
) as Record<SectionKey, number>;

const sections = stackSections(heightsPx, H);
const layout = computeStageLayout(W, H);
const documentHeight = sections[sections.length - 1].end;

const frameAtScrollY = (scrollY: number): SceneFrame => createFrame(scrollY, layout, sections, false);

/** 특정 섹션의 내부 진행도(p, 0~1)에 해당하는 scrollY로 프레임을 만든다 */
const frameAtSectionProgress = (key: SectionKey, p: number): SceneFrame => {
  const section = sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`section not found: ${key}`);
  const denom = Math.max(section.height - H, 1);
  return frameAtScrollY(section.top + p * denom);
};

describe("computePhones", () => {
  it("hero에서 A·B 회전이 ∓12°다", () => {
    const { a, b } = computePhones(frameAtScrollY(0));
    expect(a.rotate).toBeCloseTo(-12);
    expect(b.rotate).toBeCloseTo(12);
  });

  it("archive 0.72 지점에서 둘 다 회전 0·중심 일치다", () => {
    const { a, b } = computePhones(frameAtSectionProgress("archive", 0.72));
    expect(a.rotate).toBeCloseTo(0);
    expect(b.rotate).toBeCloseTo(0);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });

  it("archive 0.86 이후 B 불투명도가 0이다", () => {
    const { b } = computePhones(frameAtSectionProgress("archive", 0.86));
    expect(b.opacity).toBeCloseTo(0);
  });

  it("recommend 고정이 끝나면 A가 페이지와 함께 위로 빠지고, ar 시작 때는 화면 밖(한 화면 위)이다", () => {
    const recommend = sections.find((section) => section.key === "recommend");
    if (!recommend) throw new Error("recommend not found");
    const stickyEnd = recommend.end - H;
    expect(computePhones(frameAtScrollY(stickyEnd)).a.y).toBeCloseTo(layout.center.y);
    expect(computePhones(frameAtScrollY(stickyEnd + 300)).a.y).toBeCloseTo(layout.center.y - 300);
    expect(computePhones(frameAtScrollY(recommend.end - 1)).a.y).toBeCloseTo(layout.center.y - H + 1);
  });

  it("ar 0.3에서 A 불투명도가 0이다", () => {
    const { a } = computePhones(frameAtSectionProgress("ar", 0.3));
    expect(a.opacity).toBeCloseTo(0);
  });

  it("ar 0.56에서 A가 제자리(스테이지 중심)로 돌아온다", () => {
    const { a } = computePhones(frameAtSectionProgress("ar", 0.56));
    expect(a.y).toBeCloseTo(layout.center.y);
  });

  it("share sh 끝(0.52)에서 A.x = cx - 0.13W, B.x = cx + 0.13W다", () => {
    const { a, b } = computePhones(frameAtSectionProgress("share", TIMELINE.shareXShift[1]));
    expect(a.x).toBeCloseTo(layout.center.x - 0.13 * W);
    expect(b.x).toBeCloseTo(layout.center.x + 0.13 * W);
  });
});

describe("share: 폰 B 등장과 QR 비행(`docs/plans/0009`)", () => {
  it("QR 모달이 뜬 뒤에야 B가 들어오기 시작한다", () => {
    expect(TIMELINE.shareXShift[0]).toBeGreaterThanOrEqual(TIMELINE.share.qrModal[1]);
    const { b } = computePhones(frameAtSectionProgress("share", TIMELINE.share.qrModal[1]));
    expect(b.opacity).toBe(0);
  });

  it("QR은 A 화면 모달 속 QR 자리에서 출발해 B 스캔 틀 가운데에 도착한다", () => {
    const k = PHONE_3D.screen.width / SHARE_SCREEN.designWidth;
    const designHeight = (PHONE_3D.screen.height / PHONE_3D.screen.width) * SHARE_SCREEN.designWidth;
    const S = layout.scale;
    const start = computePhones(frameAtSectionProgress("share", TIMELINE.qrFlight[0] + 1e-6));
    expect(start.qrFlight.x).toBeCloseTo(start.a.x, 0);
    expect(start.qrFlight.y).toBeCloseTo(start.a.y + SHARE_SCREEN.qrModal.qrOffsetY * k * S, 0);
    const end = computePhones(frameAtSectionProgress("share", TIMELINE.qrFlight[1] - 1e-6));
    expect(end.qrFlight.x).toBeCloseTo(end.b.x, 0);
    expect(end.qrFlight.y).toBeCloseTo(
      end.b.y + (SHARE_SCREEN.scanFrame.centerYRatio - 0.5) * designHeight * k * S,
      0,
    );
  });
});

describe("closing: 폰 A가 오른쪽에 크게 선다(`docs/plans/0010`)", () => {
  const share = sections.find((section) => section.key === "share");
  if (!share) throw new Error("share not found");
  const stickyEnd = share.end - H;

  it("share 고정 끝까지는 share 자리·원래 크기다", () => {
    const { a } = computePhones(frameAtScrollY(stickyEnd));
    expect(a.x).toBeCloseTo(layout.center.x - 0.13 * W);
    expect(a.scale).toBeCloseTo(layout.scale);
  });

  it("share가 끝나면 B는 오른쪽으로 빠지고, A는 (0.78W, 0.5H)에서 화면 높이 80%로 선다", () => {
    const { a, b } = computePhones(frameAtScrollY(share.end));
    expect(a.x).toBeCloseTo(CLOSING_PHONE.centerXRatio * W);
    expect(a.y).toBeCloseTo(CLOSING_PHONE.centerYRatio * H);
    expect(a.scale * PHONE.height).toBeCloseTo(CLOSING_PHONE.heightRatio * H);
    expect(a.rotate).toBe(0);
    expect(b.x).toBeGreaterThan(W);
  });

  it("closing 아래 푸터가 올라오면 폰이 잘리지 않게 푸터 위 남은 공간에 맞춰 자연스럽게 작아진다(팀 피드백)", () => {
    const closing = sections.find((section) => section.key === "closing");
    if (!closing) throw new Error("closing not found");
    const atTop = computePhones(frameAtScrollY(closing.top)).a;
    const footer = 160;
    const scrolled = computePhones(frameAtScrollY(closing.top + footer)).a;
    const halfHeight = (PHONE.height / 2) * scrolled.scale;
    expect(scrolled.y - halfHeight).toBeGreaterThanOrEqual(0);
    expect(scrolled.y + halfHeight).toBeLessThanOrEqual(H - footer);
    expect(scrolled.scale * PHONE.height).toBeCloseTo(CLOSING_PHONE.heightRatio * (H - footer));
    expect(scrolled.scale).toBeLessThan(atTop.scale);
    expect(scrolled.x).toBeCloseTo(atTop.x);
  });

  it("좁은 화면에선 폰 오른쪽 끝이 여백 안에 들어오게 줄인다", () => {
    const w = 1024;
    const h = 1000;
    const narrowSections = stackSections({}, h);
    const narrowLayout = computeStageLayout(w, h);
    const narrowShare = narrowSections.find((section) => section.key === "share");
    if (!narrowShare) throw new Error("share not found");
    const { a } = computePhones(createFrame(narrowShare.end, narrowLayout, narrowSections, false));
    const rightEdge = a.x + (PHONE.width / 2) * a.scale;
    expect(rightEdge).toBeCloseTo(w - CLOSING_PHONE.edgeMarginPx);
    expect(a.scale * PHONE.height).toBeLessThan(CLOSING_PHONE.heightRatio * h);
  });

  it("폰이 작아지지는 않는다(배율 1 이상)", () => {
    const w = 1100;
    const h = 600;
    const wideSections = stackSections({}, h);
    const wideLayout = computeStageLayout(w, h);
    const wideShare = wideSections.find((section) => section.key === "share");
    if (!wideShare) throw new Error("share not found");
    const { a } = computePhones(createFrame(wideShare.end, wideLayout, wideSections, false));
    expect(a.scale).toBeGreaterThanOrEqual(wideLayout.scale);
  });

  it("모바일은 가운데로 돌아오고, 기본 크기보다 크게 선다(모바일 확대, 이슈 #50)", () => {
    const w = 390;
    const h = 844;
    const mobileSections = stackSections({}, h);
    const mobileLayout = computeStageLayout(w, h);
    const mobileShare = mobileSections.find((section) => section.key === "share");
    if (!mobileShare) throw new Error("share not found");
    const { a } = computePhones(createFrame(mobileShare.end, mobileLayout, mobileSections, false));
    expect(a.x).toBeCloseTo(mobileLayout.center.x);
    expect(a.y).toBeCloseTo(mobileLayout.center.y);
    expect(a.scale).toBeGreaterThan(mobileLayout.scale);
  });
});

describe("computeScreens", () => {
  it("시작은 홈 화면이다", () => {
    const { a } = computeScreens(frameAtScrollY(0));
    expect(a.home).toBeCloseTo(1);
    expect(a.record).toBeCloseTo(0);
    expect(a.report).toBeCloseTo(0);
    expect(a.recommend).toBeCloseTo(0);
    expect(a.ar).toBeCloseTo(0);
    expect(a.qrShare).toBeCloseTo(0);
    expect(a.closingHome).toBeCloseTo(0);
  });

  it("리포트 섹션이 화면에 붙기 전에 상세(리포트) 화면으로 다 바뀌고, 그 전까지는 기록 화면이다", () => {
    // record 고정 끝 직후에는 아직 기록 화면
    const record = sections.find((section) => section.key === "record");
    if (!record) throw new Error("record not found");
    const afterHandoff = computeScreens(frameAtScrollY(record.end - H + 200)).a;
    expect(afterHandoff.record).toBeCloseTo(1);
    // 리포트 섹션 시작(본문 스크롤 시작 전)에는 리포트 화면만 보인다
    const atReport = computeScreens(frameAtSectionProgress("report", 0)).a;
    expect(atReport.report).toBeCloseTo(1);
    expect(atReport.record).toBeCloseTo(0);
  });

  it("추천 섹션이 화면에 붙을 때(진행도 0) 이미 추천 화면이다 — 3D 오버레이와 같은 밴드(`docs/plans/0007`)", () => {
    const atRecommend = computeScreens(frameAtSectionProgress("recommend", 0)).a;
    expect(atRecommend.recommend).toBeCloseTo(1);
    expect(atRecommend.report).toBeCloseTo(0);
  });

  it("share 고정 끝까진 기록 공유 화면이고, share가 끝나면 closing 홈 화면이다(히어로 홈과 다른 화면)", () => {
    const share = sections.find((section) => section.key === "share");
    if (!share) throw new Error("share not found");
    const atStickyEnd = computeScreens(frameAtScrollY(share.end - H)).a;
    expect(atStickyEnd.qrShare).toBeCloseTo(1);
    expect(atStickyEnd.closingHome).toBeCloseTo(0);
    const atEnd = computeScreens(frameAtScrollY(share.end)).a;
    expect(atEnd.closingHome).toBeCloseTo(1);
    expect(atEnd.qrShare).toBeCloseTo(0);
    expect(atEnd.home).toBeCloseTo(0);
  });

  it("어느 지점이든 A 화면 opacity 합은 1을 넘지 않는다", () => {
    const step = 50;
    for (let scrollY = 0; scrollY <= documentHeight; scrollY += step) {
      const { a } = computeScreens(frameAtScrollY(scrollY));
      const sum = a.home + a.record + a.report + a.recommend + a.ar + a.qrShare + a.closingHome;
      expect(sum).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});
