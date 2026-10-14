import type { SectionKey } from "@/shared/config";

/** 섹션이 보여 줄 화면 — 모두 정지 이미지라 스크롤마다 계산하지 않는다 */
export type MobileVisual =
  /** 폰 한 대 + 화면 이미지 */
  | { kind: "screen"; src: string; alt: string }
  /** 추천 결과 Top 3 카드가 옆으로 넘어가는 캐러셀(토스 상품 카드 참고) */
  | { kind: "carousel" }
  /** 폰 두 대 나란히. isTilted면 V자로 기울인다(히어로, 데스크톱 히어로 V자와 같은 느낌) */
  | {
      kind: "pair";
      left: { src: string; alt: string };
      right: { src: string; alt: string };
      isTilted?: boolean;
    };

export type MobileSection = {
  key: SectionKey;
  tone: "light" | "dark";
  visual: MobileVisual;
};

/**
 * 모바일 랜딩 구성(이슈 #52) — toss.im 모바일처럼 섹션을 위에서 아래로 쌓는다. 순서·문구는 데스크톱과 같고
 * (`SECTION_KEYS`, `COPY.sections`), 각 섹션은 회색 카드 안 평면 폰 목업(`phone-frame.svg`)에 화면을 끼워 보여 준다.
 * 화면은 피그마 정지 이미지. 3D(Spline)는 모바일에서 쓰지 않는다.
 */
export const MOBILE_SECTIONS: readonly MobileSection[] = [
  {
    key: "hero",
    tone: "light",
    visual: {
      kind: "pair",
      left: { src: "/screens/home.png", alt: "Heddy 홈 화면" },
      right: { src: "/screens/mobile/ar.webp", alt: "AR 스타일 체험 화면" },
      isTilted: true,
    },
  },
  {
    key: "archive",
    tone: "light",
    visual: { kind: "screen", src: "/screens/home.png", alt: "Heddy 홈 화면" },
  },
  {
    key: "record",
    tone: "light",
    // 데스크톱 기록 화면과 같은 배치(카드 6장이 쌓인 상태)로 합성한 이미지
    visual: { kind: "screen", src: "/screens/mobile/record.webp", alt: "Heddy 시술기록 화면" },
  },
  {
    key: "report",
    tone: "light",
    visual: { kind: "screen", src: "/screens/mobile/report.webp", alt: "다운펌 분석 리포트 화면" },
  },
  { key: "recommend", tone: "light", visual: { kind: "carousel" } },
  {
    key: "ar",
    tone: "dark",
    visual: { kind: "screen", src: "/screens/mobile/ar.webp", alt: "AR 스타일 체험 화면" },
  },
  {
    key: "share",
    tone: "light",
    visual: {
      kind: "pair",
      left: { src: "/screens/mobile/share-qr.webp", alt: "시술 기록 공유 QR 화면" },
      right: { src: "/screens/mobile/share-record.webp", alt: "미용실에서 받은 시술 기록 화면" },
    },
  },
  {
    key: "closing",
    tone: "light",
    visual: { kind: "screen", src: "/screens/closing/home.webp", alt: "Heddy 홈 화면" },
  },
];
