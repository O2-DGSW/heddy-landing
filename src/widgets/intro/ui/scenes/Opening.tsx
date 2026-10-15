"use client";

import { useRef } from "react";

import Image from "next/image";

import { INTRO, INTRO_COPY } from "@/shared/config";

import { applyLayer } from "../../model/layer";
import { baselineY, tileX } from "../../model/scenes/common";
import {
  S1_WORD_X,
  S2_GEOMETRY,
  S2_ROLL_STEP,
  S2_TOP,
  S2_LEFT,
  s01,
  s02,
  s03,
  s04,
  S4_LABEL_Y,
} from "../../model/scenes/opening";
import { useIntroScene } from "../IntroClock";
import { Box, Layer, Picture, Text, Tile, tileShadow, type TileIcon } from "../primitives";

const { mint, ink } = INTRO.colors;
const { scenes } = INTRO;
/** 장면 루트(무대 크기, 바탕색) */
const SCENE_CLASS = "invisible absolute inset-0";

/* S01 민트 · 단어 타이핑 */
export const S01 = () => {
  const lineRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s01, (t) => {
    const s = s01(t);
    applyLayer(lineRef.current, { x: s.line, y: 0 });
    s.words.forEach((word, i) => applyLayer(wordRefs.current[i], word));
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#41BE8E]`}>
      <Layer ref={lineRef} isHidden={false}>
        {INTRO_COPY.s1.map(([word, weight], i) => (
          <Text
            key={`${word}-${S1_WORD_X[i]}`}
            ref={(node) => {
              wordRefs.current[i] = node;
            }}
            text={word}
            size={88}
            weight={weight}
            color="#FFFFFF"
            tracking={-35}
          />
        ))}
      </Layer>
    </div>
  );
};

/* S02 슬롯 롤링 문구 */
export const S02 = () => {
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const underlineRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s02, (t, root) => {
    const s = s02(t);
    root.style.opacity = String(s.scene / 100);
    const y = baselineY(S2_TOP, 64);
    const pinXs = [S2_LEFT, S2_GEOMETRY.tailX, S2_GEOMETRY.closeQuoteX];
    pinRefs.current.forEach((pin, i) => applyLayer(pin, { x: pinXs[i], y, opacity: s.pins }));
    const { underline } = S2_GEOMETRY;
    applyLayer(underlineRef.current, { x: underline.x, y: underline.y, scaleX: s.underline });
    applyLayer(rollRef.current, { x: 0, y: s.roll });
    s.items.forEach((item, i) =>
      applyLayer(itemRefs.current[i], {
        x: 0,
        y: baselineY(i * S2_ROLL_STEP, 64),
        opacity: item.opacity,
        blur: item.blur,
      }),
    );
  });
  const pins = ["“", INTRO_COPY.s2Tail, "”"];
  const lastIndex = INTRO_COPY.s2Roll.length - 1;
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      {pins.map((text, i) => (
        <Text
          key={text}
          ref={(node) => {
            pinRefs.current[i] = node;
          }}
          text={text}
          size={64}
          weight={700}
          color={i === 1 ? "#B9BDC1" : "#6B7075"}
        />
      ))}
      <Box ref={underlineRef} width={S2_GEOMETRY.underline.width} height={3} color={ink} />
      {/* 롤링 영역(마스크) */}
      <div
        className="absolute h-[84px] overflow-hidden"
        style={{ left: S2_GEOMETRY.rollX, top: S2_TOP, width: S2_GEOMETRY.rollWidth }}
      >
        <Layer ref={rollRef} isHidden={false}>
          {INTRO_COPY.s2Roll.map((text, i) => (
            <Text
              key={text}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              text={text}
              size={64}
              weight={i === lastIndex ? 800 : 600}
              color={i === lastIndex ? ink : "#8D9297"}
            />
          ))}
        </Layer>
      </div>
    </div>
  );
};

/* S03 로고: 원 → 심볼 → 워드마크 e 자리 → 민트 반전 + 스윕 */
export const S03 = () => {
  const mintRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const whiteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wipeRef = useRef<HTMLDivElement>(null);
  const rootRef = useIntroScene(scenes.s03, (t) => {
    const s = s03(t);
    if (mintRef.current) mintRef.current.style.visibility = s.isMint ? "visible" : "hidden";
    applyLayer(circleRef.current, s.circle);
    applyLayer(symbolRef.current, s.symbol);
    const black = blackRef.current;
    if (black) {
      applyLayer(black, { x: 960, y: 540, opacity: s.wordmarkBlack.visible ? 100 : 0 });
      // 기준점 div는 크기가 0이라 이미지에 건다
      const img = black.firstElementChild as HTMLElement | null;
      if (img) img.style.clipPath = `inset(-10% ${s.wordmarkBlack.right}% -10% ${s.wordmarkBlack.left}%)`;
    }
    whiteRefs.current.forEach((node, i) =>
      applyLayer(node, { x: 960, y: 540, scale: s.whiteScale, opacity: s.isMint ? (i === 0 ? 35 : 100) : 0 }),
    );
    // Linear Wipe 270°(왼→오른쪽으로 드러남), 페더 400(원본 px) ≈ 워드마크 폭의 20%
    const wipe = wipeRef.current;
    if (wipe) {
      const edge = 100 - s.wipe;
      const mask = `linear-gradient(90deg, #000 ${edge * 1.2 - 20}%, transparent ${edge * 1.2}%)`;
      wipe.style.maskImage = mask;
      wipe.style.webkitMaskImage = mask;
    }
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      <div ref={mintRef} className="invisible absolute inset-0 bg-[#41BE8E]" />
      <Layer ref={circleRef}>
        <div className="absolute left-[-100px] top-[-100px] size-[200px] rounded-full bg-[#41BE8E]/[0.28]" />
      </Layer>
      <Picture ref={blackRef} src="logo_wordmark.png" srcWidth={2003} srcHeight={677} width={720} />
      <Picture
        ref={(node) => {
          whiteRefs.current[0] = node;
        }}
        src="logo_wordmark_white.png"
        srcWidth={2003}
        srcHeight={677}
        width={720}
      />
      <Layer
        ref={(node) => {
          whiteRefs.current[1] = node;
        }}
      >
        <div ref={wipeRef} className="absolute left-[-360px] top-[-121.65px] h-[243.3px] w-[720px]">
          <Image loading="eager" src="/intro/logo_wordmark_white.png" alt="" fill sizes="720px" />
        </div>
      </Layer>
      <Picture ref={symbolRef} src="logo_symbol.png" srcWidth={1004} srcHeight={1004} width={320} />
    </div>
  );
};

/* S04 기능 아이콘 4종 + 라벨 하이라이트 */
const ICONS: readonly TileIcon[] = ["scissors", "share", "ar", "rec"];

export const S04 = () => {
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const grayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const strongRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s04, (t) => {
    s04(t).forEach((item, i) => {
      applyLayer(tileRefs.current[i], item.tile);
      const shadow = shadowRefs.current[i];
      if (shadow) shadow.style.filter = tileShadow(128, item.shadow);
      applyLayer(grayRefs.current[i], item.gray);
      applyLayer(strongRefs.current[i], item.strong);
    });
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      {ICONS.map((icon, i) => (
        <div key={icon}>
          <Tile
            ref={(node) => {
              tileRefs.current[i] = node;
            }}
            shadowRef={(node) => {
              shadowRefs.current[i] = node;
            }}
            icon={icon}
            size={128}
          />
          <Text
            ref={(node) => {
              grayRefs.current[i] = node;
            }}
            text={INTRO_COPY.s4[i]}
            size={28}
            weight={500}
            color="#B9BDC1"
            tracking={-20}
            align="center"
          />
          <Text
            ref={(node) => {
              strongRefs.current[i] = node;
            }}
            text={INTRO_COPY.s4[i]}
            size={28}
            weight={700}
            color={ink}
            tracking={-20}
            align="center"
          />
        </div>
      ))}
    </div>
  );
};

/** S04 라벨 기준선(테스트·다른 장면 공유용) */
export const S4_LABEL_BASELINE = S4_LABEL_Y;
export const S4_TILE_X = tileX;
export const MINT = mint;
