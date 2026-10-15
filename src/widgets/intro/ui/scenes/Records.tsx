"use client";

import { useRef } from "react";

import Image from "next/image";

import { INTRO, INTRO_COPY, INTRO_LAYOUT } from "@/shared/config";

import { applyLayer } from "../../model/layer";
import { baselineY } from "../../model/scenes/common";
import {
  S5_HEAD_LEFT,
  S5_PANELS,
  S6_FLOATS,
  S7_CARD_PITCH,
  S7_CARD_Y,
  S7_LAND,
  S7_SLOT_STEP,
  S8_BARS,
  S8_K,
  s05,
  s06,
  s07,
  s08,
} from "../../model/scenes/records";
import { useIntroScene } from "../IntroClock";
import { dropShadow, Layer, Phone, Picture, Text, Tile, type TileIcon } from "../primitives";

const { scenes, colors } = INTRO;
const SCENE_CLASS = "invisible absolute inset-0 bg-[#F4F5F6]";
const ICONS: readonly TileIcon[] = ["scissors", "share", "ar", "rec"];
const cardSrc = (n: number) => `card${String(n).padStart(2, "0")}.png`;

/* S05 흩어진 시술 기록을 + 화면 패널 줄 + 헤디 카드 */
export const S05 = () => {
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const driftRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const rootRef = useIntroScene(scenes.s05, (t, root) => {
    const s = s05(t);
    root.style.opacity = String(s.scene / 100);
    s.tiles.forEach((tile, i) => applyLayer(tileRefs.current[i], tile));
    s.words.forEach((word, i) => applyLayer(wordRefs.current[i], word));
    applyLayer(driftRef.current, { x: s.drift, y: 0 });
    s.panels.forEach((panel, i) => applyLayer(panelRefs.current[i], panel));
    applyLayer(cardRef.current, s.brandCard);
  });
  return (
    <div ref={rootRef} className={SCENE_CLASS}>
      {ICONS.map((icon, i) => (
        <Tile
          key={icon}
          ref={(node) => {
            tileRefs.current[i] = node;
          }}
          icon={icon}
          size={128}
          isHidden={false}
        />
      ))}
      {[INTRO_COPY.s5a, INTRO_COPY.s5b].map((text, i) => (
        <Text
          key={text}
          ref={(node) => {
            wordRefs.current[i] = node;
          }}
          text={text}
          size={60}
          weight={i === 0 ? 500 : 800}
          color={i === 0 ? "#B0B5BA" : colors.ink}
          tracking={-35}
        />
      ))}
      <Layer ref={driftRef} isHidden={false}>
        {S5_PANELS.map(([src, srcWidth, srcHeight], i) => (
          <Layer
            key={src}
            ref={(node) => {
              panelRefs.current[i] = node;
            }}
          >
            <div
              className="absolute left-[-150px] top-[-300px] h-[600px] w-[300px] overflow-hidden rounded-[26px] bg-white"
              style={{ filter: dropShadow(colors.ink, 10, 20, 50) }}
            >
              <Image
                src={`/intro/${src}`}
                alt=""
                width={300}
                height={Math.round((300 * srcHeight) / srcWidth)}
                sizes="300px"
                loading="eager"
                className="absolute left-0 top-0 w-[300px] max-w-none"
              />
              {i % 2 === 0 ? <div className="absolute inset-0 bg-[#41BE8E]/[0.16]" /> : null}
            </div>
          </Layer>
        ))}
      </Layer>
      <Layer ref={cardRef}>
        <div
          className="absolute left-[-160px] top-[-320px] h-[640px] w-[320px] rounded-[30px] bg-[#41BE8E]"
          style={{ filter: dropShadow(colors.mint, 35, 30, 70) }}
        >
          <Image
            loading="eager"
            src="/intro/logo_symbol_white.png"
            alt=""
            width={150}
            height={150}
            className="absolute left-[85px] top-[199.9px]"
          />
          <Image
            loading="eager"
            src="/intro/logo_wordmark_white.png"
            alt=""
            width={190}
            height={64}
            className="absolute left-[65px] top-[375.9px] h-[64.2px] w-[190px]"
          />
        </div>
      </Layer>
    </div>
  );
};

/** S05 머리글 x(테스트용) */
export const S5_HEAD_X = (i: number) => S5_HEAD_LEFT + INTRO_LAYOUT.s5.x[i];

/* S06 한 곳에 차곡차곡 + 큰 리스트 UI + 떠다니는 아이콘 */
const S6_K = 520 / 402;

export const S06 = () => {
  const uiRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s06, (t) => {
    const s = s06(t);
    applyLayer(uiRef.current, s.ui);
    s.lines.forEach((line, i) => applyLayer(lineRefs.current[i], line));
    s.floats.forEach((float, i) => applyLayer(floatRefs.current[i], float));
  });
  return (
    <div ref={rootRef} className={SCENE_CLASS}>
      {/* 기준점 (260, 300) */}
      <Layer ref={uiRef}>
        <div
          className="absolute left-[-260px] top-[-300px] h-[1130px] w-[520px] overflow-hidden rounded-[40px] bg-[#F7F7F7]"
          style={{ filter: dropShadow(colors.ink, 14, 40, 100) }}
        >
          <Image
            src="/intro/list.png"
            alt=""
            width={520}
            height={1131}
            sizes="520px"
            loading="eager"
            className="absolute left-0 top-0"
          />
          {[1, 2, 3, 4, 5, 6].map((n, i) => (
            <Image
              key={n}
              src={`/intro/${cardSrc(n)}`}
              alt=""
              width={Math.round(372 * S6_K)}
              height={Math.round(128 * S6_K)}
              sizes="481px"
              loading="eager"
              className="absolute"
              style={{ left: 15 * S6_K, top: (145 + 134 * i) * S6_K, width: 372 * S6_K }}
            />
          ))}
        </div>
      </Layer>
      {[INTRO_COPY.s6a, INTRO_COPY.s6b].map((text, i) => (
        <Text
          key={text}
          ref={(node) => {
            lineRefs.current[i] = node;
          }}
          text={text}
          size={76}
          weight={800}
          color={colors.mintDark}
          tracking={-40}
        />
      ))}
      {S6_FLOATS.map(([icon, size], i) => (
        <Tile
          key={icon}
          ref={(node) => {
            floatRefs.current[i] = node;
          }}
          icon={icon}
          size={size}
        />
      ))}
    </div>
  );
};

/* S07 폰 + 시술기록 카드 12장 팝 쌓임(가속) + 카운트 */
const SLOT_WORDS = [...INTRO_COPY.s7Count, INTRO_COPY.s7n];
const SLOT_WIDTH = Math.max(...INTRO_LAYOUT.s7w) + 20;

export const S07 = () => {
  const phoneRef = useRef<HTMLDivElement>(null);
  const listRefs = useRef<(HTMLDivElement | null)[]>([]);
  const popRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const slotWordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tailRef = useRef<HTMLDivElement>(null);
  const explainRef = useRef<HTMLDivElement>(null);
  const rootRef = useIntroScene(scenes.s07, (t) => {
    const s = s07(t);
    applyLayer(phoneRef.current, s.phone);
    s.listCards.forEach((card, j) => applyLayer(listRefs.current[j], card));
    s.popCards.forEach((card, j) => applyLayer(popRefs.current[j], card));
    applyLayer(slotRef.current, s.slot);
    applyLayer(rollRef.current, { x: 0, y: s.roll });
    s.slotWords.forEach((word, i) =>
      applyLayer(slotWordRefs.current[i], { x: 0, y: baselineY(i * S7_SLOT_STEP + 4, 96), ...word }),
    );
    applyLayer(tailRef.current, s.countTail);
    applyLayer(explainRef.current, s.explain);
  });
  return (
    <div ref={rootRef} className={SCENE_CLASS}>
      <Phone ref={phoneRef}>
        <Image
          src="/intro/list.png"
          alt=""
          width={402}
          height={874}
          sizes="402px"
          loading="eager"
          className="absolute inset-0"
        />
        {S7_LAND.map((_, j) => (
          <Picture
            key={j}
            ref={(node) => {
              listRefs.current[j] = node;
            }}
            src={cardSrc(12 - j)}
            srcWidth={1116}
            srcHeight={384}
            width={372}
          />
        ))}
        {/* 하단 탭바(고정) — 리스트 이미지 아래 265/2185 */}
        <div className="absolute bottom-0 left-0 h-[106px] w-[402px] overflow-hidden">
          <Image
            loading="eager"
            src="/intro/list.png"
            alt=""
            width={402}
            height={874}
            sizes="402px"
            className="absolute bottom-0 left-0"
          />
        </div>
      </Phone>
      {S7_LAND.map((_, j) => (
        <Picture
          key={j}
          ref={(node) => {
            popRefs.current[j] = node;
          }}
          src={cardSrc(12 - j)}
          srcWidth={1116}
          srcHeight={384}
          width={372}
          shadow={dropShadow("#000000", 14, 18, 30)}
        />
      ))}
      <Layer ref={slotRef}>
        <div className="absolute left-0 top-0 h-[118px] overflow-hidden" style={{ width: SLOT_WIDTH }}>
          <Layer ref={rollRef} isHidden={false}>
            {SLOT_WORDS.map((word, i) => (
              <Text
                key={word}
                ref={(node) => {
                  slotWordRefs.current[i] = node;
                }}
                text={word}
                size={96}
                weight={800}
                color={colors.mint}
                tracking={-40}
              />
            ))}
          </Layer>
        </div>
      </Layer>
      <Text ref={tailRef} text={INTRO_COPY.s7a} size={84} weight={700} color={colors.ink} tracking={-40} />
      <Text ref={explainRef} text={INTRO_COPY.s7b} size={84} weight={700} color={colors.ink} tracking={-40} />
    </div>
  );
};

/** S07 카드 자리(테스트용) */
export const S7_LIST_GEOMETRY = { y: S7_CARD_Y, pitch: S7_CARD_PITCH };

/* S08 상세 리포트 확대 + 스크롤 + 막대 그래프 */
export const S08 = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s08, (t) => {
    const s = s08(t);
    applyLayer(panelRef.current, s.panel);
    applyLayer(scrollRef.current, { x: 0, y: s.scroll });
    s.bars.forEach((bar, i) => {
      const node = barRefs.current[i];
      if (node) node.style.transform = `scaleX(${bar / 100})`;
    });
  });
  return (
    <div ref={rootRef} className={SCENE_CLASS}>
      {/* 기준점 (350, 540) */}
      <Layer ref={panelRef}>
        <div
          className="absolute left-[-350px] top-[-540px] h-[1080px] w-[700px] overflow-hidden rounded-[44px] bg-[#F7F7F7]"
          style={{ filter: dropShadow(colors.ink, 14, 40, 100) }}
        >
          <Layer ref={scrollRef} isHidden={false}>
            <Image
              src="/intro/detail.png"
              alt=""
              width={700}
              height={1963}
              sizes="700px"
              loading="eager"
              className="absolute left-0 top-0 max-w-none"
            />
            {S8_BARS.map(([y, width], i) => (
              <div key={y}>
                <div
                  className="absolute rounded-full bg-[#E6E6E7]"
                  style={{ left: 32.6 * S8_K, top: (y - 0.6) * S8_K, width: 337.6 * S8_K, height: 6 * S8_K }}
                />
                <div
                  ref={(node) => {
                    barRefs.current[i] = node;
                  }}
                  className="absolute origin-left rounded-full bg-[#41BE8E]"
                  // Tailwind scale-x-*는 별도 scale 속성이라 ref로 쓰는 transform과 곱해진다 → 초기값도 transform으로
                  style={{
                    left: 33.2 * S8_K,
                    top: y * S8_K,
                    width: width * S8_K,
                    height: 4.8 * S8_K,
                    transform: "scaleX(0)",
                  }}
                />
              </div>
            ))}
          </Layer>
        </div>
      </Layer>
    </div>
  );
};
