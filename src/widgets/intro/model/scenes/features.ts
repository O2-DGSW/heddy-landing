import { INTRO_LAYOUT } from "@/shared/config";

import { at, baselineY, clamp01, pop, reveal, sceneFade, seg, track, tween, type LayerState } from "./common";

/* ===== S09 22.4–25.4 AR 미리보기: 작은 폰 + 스와이프 크로스페이드 + 캐러셀 + 양옆 키네틱 ===== */

const S9_SWIPES = [23.35, 24.45];
/** 캐러셀 선택 칸(실수) — 손가락이 밀 때마다 1 → 2 → 3 */
const S9_CAROUSEL = track(...S9_SWIPES.map((ts, i) => seg(ts - 0.4, i + 1, ts - 0.025, i + 2, "io")));

/** 캐러셀 항목 i(0 = 없음)의 자리 — 선택(c)에서 떨어진 칸 수로 위치·지름·보임이 정해진다(원형) */
export const carouselItem = (i: number, c: number) => {
  let k = i - c;
  k = ((((k + 2.5) % 5) + 5) % 5) - 2.5;
  const a = Math.abs(k);
  const off = a < 1 ? 96.5 * a : a < 2 ? 96.5 + 80.5 * (a - 1) : 177 + 70 * (a - 2);
  const size = a < 1 ? 72 - 10 * a : a < 2 ? 62 - 12 * (a - 1) : 50 - 12 * (a - 2);
  const visible = clamp01((2.5 - a) / 0.35);
  return {
    x: 201 + (k < 0 ? -1 : 1) * off,
    size,
    opacity: visible * 100,
    ring: clamp01(1 - 2 * a) * visible * 100,
  };
};

/** 키네틱 문구 줄 가운데 높이(크기 기준점) — 크기는 가로로만 바뀐다 */
const S9_KINETIC_Y = baselineY(430, 170);

export const s09 = (t: number) => {
  const c = at(S9_CAROUSEL, t, 1);
  const tracking = at(track(seg(24.0, 0, 24.5, 60, "io"), seg(24.5, 60, 25.0, 0, "io")), t);
  const kinetic = (t0: number, t1: number, x: number): LayerState => ({
    x,
    y: S9_KINETIC_Y,
    scaleX: tween(t, t0, 180, t1, 100, "out5"),
    opacity: tween(t, t0, 0, t1, 100, "out5"),
    blur: tween(t, t0, 24, t1, 0, "out5"),
  });
  return {
    glow: { x: 960, y: 540, scale: at(track(...pop(22.4, 0, 22.85, 100)), t) } satisfies LayerState,
    phone: { x: 960, y: 540, scale: at(track(...pop(22.4, 0, 22.85, 62)), t) } satisfies LayerState,
    ar2: tween(t, 23.25, 0, 23.75, 100, "io"),
    ar3: tween(t, 24.35, 0, 24.85, 100, "io"),
    carousel: [0, 1, 2, 3, 4].map((i) => carouselItem(i, c)),
    fingers: S9_SWIPES.map((ts): LayerState => ({
      x: tween(t, ts - 0.4, 330, ts - 0.025, 90, "io"),
      y: 722,
      opacity:
        t < ts - 0.45 || t > ts + 0.05
          ? 0
          : at(track(seg(ts - 0.45, 0, ts - 0.375, 100, "lin"), seg(ts - 0.05, 100, ts + 0.05, 0, "lin")), t),
    })),
    left: kinetic(22.75, 23.6, 760),
    right: kinetic(22.9, 23.75, 1160),
    /** 자간 애니메이션(px, 원본 영상 기준) — 기본 자간 -0.03em에 더한다 */
    tracking,
  };
};

/* ===== S10 25.4–28.2 민트 · 공유 범위 토글 카드 ===== */

export const S10_CARDS = [
  { on: false, color: "#F2B84B", left: 700, top: 250 },
  { on: true, color: "#41BE8E", left: 1060, top: 350 },
  { on: true, color: "#F2C94C", left: 740, top: 480 },
  { on: true, color: "#6FA8F5", left: 1100, top: 580 },
] as const;
export const S10_HEAD_LEFT = 960 - INTRO_LAYOUT.s10.w / 2;

export const s10 = (t: number) => ({
  scene: sceneFade(t, 28.0, 28.2),
  cards: S10_CARDS.map((card, i) => {
    const t0 = 25.5 + i * 0.12;
    const tOn = 26.3 + i * 0.35;
    const cy = card.top + 50;
    return {
      layer: {
        x: card.left + 190,
        y: tween(t, t0, cy + 40, t0 + 0.45, cy, "out5"),
        scaleX: tween(t, t0, 30, t0 + 0.45, 100, "out5"),
        opacity: tween(t, t0, 0, t0 + 0.45, 100, "out5"),
      } satisfies LayerState,
      parts: tween(t, t0 + 0.4, 0, t0 + 0.7, 100, "out"),
      /** 토글 켜짐 0~1(손잡이 위치·색) */
      toggle: card.on ? tween(t, tOn, 0, tOn + 0.25, 1, "io") : 0,
    };
  }),
  words: INTRO_LAYOUT.s10.x.map((x, i) =>
    reveal(t, 26.1 + i * 0.12, 0.6, 30, S10_HEAD_LEFT + x, baselineY(770, 60)),
  ),
});

/* ===== S11 28.2–30.6 카드 벽(기울어짐) + QR 한 번으로 공유 ===== */

type WallItem = { kind: "qr" | "card"; n: number; cx: number; cy: number };

/** 카드 벽 5열 — 열마다 시술기록 카드와 QR 모달이 섞여 있다(원본 배치 그대로) */
export const S11_WALL: WallItem[][] = [0, 1, 2, 3, 4].map((cc) => {
  let y = 0;
  const items: WallItem[] = [];
  for (let r = 0; r < 9; r += 1) {
    if ((cc + r) % 4 === 1) {
      items.push({ kind: "qr", n: 0, cx: cc * 470 + 20 + 159.5, cy: y + 224.4 });
      y += 448.8 + 26;
    } else {
      items.push({ kind: "card", n: ((cc * 5 + r * 7) % 12) + 1, cx: cc * 470 + 213.9, cy: y + 73.6 });
      y += 147.2 + 18;
    }
  }
  return items;
});
export const S11_HEAD_LEFT = 960 - INTRO_LAYOUT.s11.w / 2;

export const s11 = (t: number) => {
  const local = t - 28.2;
  return {
    columns: S11_WALL.map((_, cc) => -local * (cc % 2 ? 90 : 60) - (cc % 2 ? 120 : 0)),
    halo: tween(t, 28.3, 0, 28.8, 100, "out"),
    head: { x: 960, y: 540, scale: tween(t, 28.45, 125, 29.1, 100, "out5") } satisfies LayerState,
    words: {
      opacity: tween(t, 28.45, 0, 29.1, 100, "out5"),
      blur: tween(t, 28.45, 20, 29.1, 0, "out5"),
    },
  };
};

/* ===== S12 30.6–33.6 장식 심볼 + 다음 스타일 추천 카드 팝 ===== */

export const S12_DECO = [
  [1720, 90, 260, -18],
  [1600, 960, 220, 14],
  [110, 880, 240, -10],
  [260, 1040, 170, 22],
  [1830, 640, 150, 30],
] as const;
export const S12_REC = [
  { y: 187.6, left: 880, top: 250, rotate: -3 },
  { y: 337.6, left: 1180, top: 430, rotate: 2 },
  { y: 487.6, left: 920, top: 620, rotate: -2 },
] as const;

export const s12 = (t: number) => {
  const local = t - 30.6;
  const leadY = baselineY(420, 40);
  return {
    deco: S12_DECO.map(([x, y, , rotate], k): LayerState => {
      const t0 = 30.6 + k * 0.06;
      const dx = x > 960 ? 200 : -200;
      return {
        x: tween(t, t0, x + dx, t0 + 0.6, x, "out5"),
        y: y + Math.sin(local * 1.3 + k) * 10,
        rotate: tween(t, t0, rotate + 40, t0 + 0.6, rotate, "out5") + Math.sin(local + k) * 4,
        opacity: 95,
      };
    }),
    lead: {
      x: 220,
      y: tween(t, 30.75, leadY + 20, 31.3, leadY, "out"),
      opacity: tween(t, 30.75, 0, 31.2, 100, "out"),
    } satisfies LayerState,
    title: reveal(t, 32.1, 0.6, 40, 220, baselineY(480, 70)),
    cards: S12_REC.map((card, i): LayerState => {
      const t0 = 31.0 + i * 0.3;
      return {
        x: card.left + 181,
        y: card.top + 68,
        scale: at(track(...pop(t0, 0, t0 + 0.55, 130)), t),
        rotate: at(track(...pop(t0, 0, t0 + 0.55, card.rotate)), t),
        opacity: tween(t, t0, 0, t0 + 0.15, 100, "out"),
      };
    }),
  };
};
