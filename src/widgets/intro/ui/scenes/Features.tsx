"use client";

import { useRef } from "react";

import Image from "next/image";

import { INTRO, INTRO_COPY, INTRO_LAYOUT } from "@/shared/config";

import { applyLayer } from "../../model/layer";
import { baselineY } from "../../model/scenes/common";
import {
  S10_CARDS,
  S11_HEAD_LEFT,
  S11_WALL,
  S12_DECO,
  S12_REC,
  s09,
  s10,
  s11,
  s12,
} from "../../model/scenes/features";
import { useIntroScene } from "../IntroClock";
import { dropShadow, Layer, Phone, Picture, Text } from "../primitives";

const { colors } = INTRO;
const SCENE_CLASS = "invisible absolute inset-0";
const cardSrc = (n: number) => `card${String(n).padStart(2, "0")}.png`;

/* S09 AR 미리보기: 작은 폰 + 스와이프 크로스페이드 + 캐러셀 + 양옆 키네틱 */
const CAROUSEL_THUMBS = ["girl", "downperm", "gareuma", "faced"] as const;

export const S09 = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const ar2Ref = useRef<HTMLDivElement>(null);
  const ar3Ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fingerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftSpanRef = useRef<HTMLSpanElement>(null);
  const rightSpanRef = useRef<HTMLSpanElement>(null);
  const rootRef = useIntroScene("s09", (t) => {
    const s = s09(t);
    applyLayer(glowRef.current, s.glow);
    applyLayer(phoneRef.current, s.phone);
    if (ar2Ref.current) ar2Ref.current.style.opacity = String(s.ar2 / 100);
    if (ar3Ref.current) ar3Ref.current.style.opacity = String(s.ar3 / 100);
    s.carousel.forEach((item, i) => {
      const scale = (item.size / 72) * 100;
      applyLayer(itemRefs.current[i], { x: item.x, y: 720, scale, opacity: item.opacity });
      applyLayer(ringRefs.current[i], { x: item.x, y: 720, scale, opacity: item.ring });
    });
    s.fingers.forEach((finger, i) => applyLayer(fingerRefs.current[i], finger));
    applyLayer(leftRef.current, s.left);
    applyLayer(rightRef.current, s.right);
    // 자간 애니메이션 값은 원본 영상에서 px로 벌어진다(기본 자간 -0.03em에 더함)
    const spacing = `calc(-0.03em + ${s.tracking}px)`;
    if (leftSpanRef.current) leftSpanRef.current.style.letterSpacing = spacing;
    if (rightSpanRef.current) rightSpanRef.current.style.letterSpacing = spacing;
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      <Picture ref={glowRef} src="glow.png" srcWidth={900} srcHeight={900} width={900} />
      <Phone ref={phoneRef}>
        <Image src="/intro/arbg1.png" alt="" fill sizes="402px" loading="eager" />
        <div ref={ar2Ref} className="absolute inset-0 opacity-0">
          <Image src="/intro/arbg2.png" alt="" fill sizes="402px" loading="eager" />
        </div>
        <div ref={ar3Ref} className="absolute inset-0 opacity-0">
          <Image src="/intro/arbg3.png" alt="" fill sizes="402px" loading="eager" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Layer
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
            >
              {i === 0 ? (
                <div className="absolute left-[-36px] top-[-36px] flex size-[72px] items-center justify-center rounded-full bg-[#E2E2E3]/[0.92]">
                  <Image loading="eager" src="/intro/icon_none.png" alt="" width={72} height={72} />
                </div>
              ) : (
                <Image
                  loading="eager"
                  src={`/intro/thumb_${CAROUSEL_THUMBS[i - 1]}.png`}
                  alt=""
                  width={72}
                  height={72}
                  className="absolute left-[-36px] top-[-36px] rounded-full"
                />
              )}
            </Layer>
            <Layer
              ref={(node) => {
                ringRefs.current[i] = node;
              }}
            >
              <div className="absolute left-[-38px] top-[-38px] size-[76px] rounded-full border-4 border-[#111111]" />
            </Layer>
          </div>
        ))}
        {[0, 1].map((i) => (
          <Layer
            key={i}
            ref={(node) => {
              fingerRefs.current[i] = node;
            }}
          >
            <div className="absolute left-[-23px] top-[-23px] size-[46px] rounded-full border-2 border-white bg-[#1C1E20]/[0.16]" />
          </Layer>
        ))}
      </Phone>
      <Text
        ref={leftRef}
        spanRef={leftSpanRef}
        text={INTRO_COPY.s9a}
        size={170}
        weight={800}
        color={colors.mint}
        align="right"
      />
      <Text
        ref={rightRef}
        spanRef={rightSpanRef}
        text={INTRO_COPY.s9b}
        size={170}
        weight={300}
        color={colors.ink}
      />
    </div>
  );
};

/* S10 민트 · 공유 범위 토글 카드 */
export const S10 = () => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const partRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const knobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene("s10", (t, root) => {
    const s = s10(t);
    root.style.opacity = String(s.scene / 100);
    s.cards.forEach((card, i) => {
      applyLayer(cardRefs.current[i], card.layer);
      const parts = partRefs.current[i];
      if (parts) parts.style.opacity = String(card.parts / 100);
      const toggleTrack = trackRefs.current[i];
      if (toggleTrack) toggleTrack.style.backgroundColor = mixColor("#D5D7DA", colors.mint, card.toggle);
      const knob = knobRefs.current[i];
      if (knob) knob.style.transform = `translateX(${24 * card.toggle}px)`;
    });
    s.words.forEach((word, i) => applyLayer(wordRefs.current[i], word));
  });
  const words = [INTRO_COPY.s10a, INTRO_COPY.s10b, INTRO_COPY.s10c];
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#41BE8E]`}>
      {S10_CARDS.map((card, i) => (
        <Layer
          key={card.left}
          ref={(node) => {
            cardRefs.current[i] = node;
          }}
        >
          <div
            className="absolute left-[-190px] top-[-50px] h-[100px] w-[380px] rounded-[22px] bg-white"
            style={{ filter: dropShadow("#145A3C", 18, 18, 40) }}
          >
            <div
              ref={(node) => {
                partRefs.current[i] = node;
              }}
              className="opacity-0"
            >
              <div
                className="absolute left-[22px] top-6 size-[52px] rounded-[14px] opacity-[0.133]"
                style={{ background: card.color }}
              />
              <div
                className="absolute left-[37px] top-[39px] size-[22px] rounded-full"
                style={{ background: card.color }}
              />
              <p className="absolute left-[92px] top-[22px] whitespace-nowrap text-[26px] font-bold leading-[1.19] tracking-[-0.03em] text-[#1C1E20]">
                {INTRO_COPY.s10Toggles[i]}
              </p>
              <p className="absolute left-[92px] top-[58px] whitespace-nowrap text-[18px] font-medium leading-[1.19] tracking-[-0.03em] text-[#9AA0A6]">
                {INTRO_COPY.s10ToggleSub}
              </p>
              <div
                ref={(node) => {
                  trackRefs.current[i] = node;
                }}
                className="absolute left-[300px] top-[34px] h-8 w-14 rounded-2xl bg-[#D5D7DA]"
              />
              <div
                ref={(node) => {
                  knobRefs.current[i] = node;
                }}
                className="absolute left-[303px] top-[37px] size-[26px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>
        </Layer>
      ))}
      {words.map((text, i) => (
        <Text
          key={text}
          ref={(node) => {
            wordRefs.current[i] = node;
          }}
          text={text}
          size={60}
          weight={i === 1 ? 800 : 400}
          color="#FFFFFF"
          tracking={-35}
        />
      ))}
    </div>
  );
};

/** 두 색(#RRGGBB)을 p(0~1)만큼 섞는다 */
const mixColor = (from: string, to: string, p: number): string => {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((a >> shift) & 255) + (((b >> shift) & 255) - ((a >> shift) & 255)) * p);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
};

/* S11 카드 벽(기울어짐) + QR 한 번으로 공유 */
export const S11 = () => {
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const haloRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene("s11", (t) => {
    const s = s11(t);
    s.columns.forEach((y, i) => applyLayer(columnRefs.current[i], { x: 0, y }));
    applyLayer(haloRef.current, { x: 960, y: 540, opacity: s.halo });
    applyLayer(headRef.current, s.head);
    const y = baselineY(445, 150);
    INTRO_LAYOUT.s11.x.forEach((x, i) =>
      applyLayer(wordRefs.current[i], {
        x: S11_HEAD_LEFT + x,
        y,
        opacity: s.words.opacity,
        blur: s.words.blur,
      }),
    );
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      {/* 카드 벽 2300×2600 — 기준점 (1150, 750)을 무대 가운데에, -6° 기울임, 75% */}
      <div className="absolute left-[-190px] top-[-210px] h-[2600px] w-[2300px] origin-[1150px_750px] rotate-[-6deg] opacity-75">
        {S11_WALL.map((column, cc) => (
          <Layer
            key={cc}
            ref={(node) => {
              columnRefs.current[cc] = node;
            }}
            isHidden={false}
          >
            {column.map((item, r) =>
              item.kind === "qr" ? (
                <Picture
                  key={r}
                  position={[item.cx, item.cy]}
                  src="qrmodal.png"
                  srcWidth={870}
                  srcHeight={1224}
                  width={319}
                  isHidden={false}
                  className="rounded-[24px]"
                  shadow={dropShadow("#000000", 8, 14, 34)}
                />
              ) : (
                <Picture
                  key={r}
                  position={[item.cx, item.cy]}
                  src={cardSrc(item.n)}
                  srcWidth={1116}
                  srcHeight={384}
                  width={427.8}
                  isHidden={false}
                />
              ),
            )}
          </Layer>
        ))}
      </div>
      <Picture ref={haloRef} src="halo.png" srcWidth={1600} srcHeight={560} width={1600} />
      <Layer ref={headRef}>
        <div className="absolute left-[-960px] top-[-540px]">
          {[INTRO_COPY.s11a, INTRO_COPY.s11b].map((text, i) => (
            <Text
              key={text}
              ref={(node) => {
                wordRefs.current[i] = node;
              }}
              text={text}
              size={150}
              weight={800}
              color={i === 0 ? colors.mint : colors.ink}
              tracking={-50}
            />
          ))}
        </div>
      </Layer>
    </div>
  );
};

/* S12 장식 심볼 + 다음 스타일 추천 카드 팝 */
export const S12 = () => {
  const decoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leadRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene("s12", (t) => {
    const s = s12(t);
    s.deco.forEach((deco, i) => applyLayer(decoRefs.current[i], deco));
    applyLayer(leadRef.current, s.lead);
    applyLayer(titleRef.current, s.title);
    s.cards.forEach((card, i) => applyLayer(cardRefs.current[i], card));
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      {S12_DECO.map(([x, , size], i) => (
        <Picture
          key={x}
          ref={(node) => {
            decoRefs.current[i] = node;
          }}
          src="logo_symbol.png"
          srcWidth={1004}
          srcHeight={1004}
          width={size}
        />
      ))}
      <Text ref={leadRef} text={INTRO_COPY.s12a} size={40} weight={500} color="#5B6066" />
      <Text ref={titleRef} text={INTRO_COPY.s12b} size={70} weight={800} color={colors.mint} tracking={-45} />
      {S12_REC.map((card, i) => (
        <Layer
          key={card.y}
          ref={(node) => {
            cardRefs.current[i] = node;
          }}
        >
          {/* 추천 화면(402 폭)에서 카드 한 장 자리만 잘라 낸다 */}
          <div
            className="absolute left-[-181px] top-[-68px] h-[135.6px] w-[362.8px] overflow-hidden rounded-2xl"
            style={{ filter: dropShadow(colors.ink, 14, 26, 60) }}
          >
            <Image
              src="/intro/recommend.png"
              alt=""
              width={402}
              height={1129}
              sizes="402px"
              loading="eager"
              className="absolute max-w-none"
              style={{ left: -19.2, top: -card.y, width: 402 }}
            />
          </div>
        </Layer>
      ))}
    </div>
  );
};
