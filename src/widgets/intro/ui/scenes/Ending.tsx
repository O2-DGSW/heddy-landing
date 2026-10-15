"use client";

import { useRef } from "react";

import Image from "next/image";

import { INTRO, INTRO_COPY, INTRO_LAYOUT } from "@/shared/config";

import { applyLayer } from "../../model/layer";
import { S13_LINE2, S13_WAVE, S14_CHARS, s13, s14, s15 } from "../../model/scenes/ending";
import { useIntroScene } from "../IntroClock";
import { dropShadow, Layer, Picture, Text } from "../primitives";

const { scenes, colors } = INTRO;
const SCENE_CLASS = "invisible absolute inset-0";
const GRAY = "#A3A8AD";

/* S13 "여～러" 번의 기록으로 완성되는 / 나만의 (심볼) 헤디로 */
export const S13 = () => {
  const yeoRef = useRef<HTMLDivElement>(null);
  const reoRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGPolylineElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const rootRef = useIntroScene(scenes.s13, (t) => {
    const s = s13(t);
    applyLayer(yeoRef.current, s.yeo);
    applyLayer(reoRef.current, s.reo);
    const wave = waveRef.current;
    if (wave) {
      wave.style.visibility = s.wave ? "visible" : "hidden";
      if (s.wave) wave.setAttribute("points", s.wave.map(([x, y]) => `${x},${y}`).join(" "));
    }
    applyLayer(tailRef.current, s.tail);
    applyLayer(line2Ref.current, s.line2);
  });
  const { left, top } = S13_LINE2;
  const kids = INTRO_LAYOUT.s13.kids;
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      <Text ref={yeoRef} text={INTRO_COPY.s13y} size={120} weight={800} color={colors.mint} tracking={-20} />
      <Text ref={reoRef} text={INTRO_COPY.s13r} size={120} weight={800} color={colors.mint} tracking={-20} />
      <svg
        className="absolute overflow-visible"
        style={{ left: S13_WAVE.x, top: S13_WAVE.y }}
        width={S13_WAVE.width}
        height={60}
        aria-hidden="true"
      >
        <polyline
          ref={waveRef}
          fill="none"
          stroke={colors.mint}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Text ref={tailRef} text={INTRO_COPY.s13a} size={48} weight={500} color={GRAY} />
      <Layer ref={line2Ref}>
        <p
          className="absolute whitespace-nowrap text-[48px] font-medium leading-[1.19] tracking-[-0.03em] text-[#A3A8AD]"
          style={{ left: left + kids[0][0], top: top + kids[0][1] }}
        >
          {INTRO_COPY.s13b}
        </p>
        <Image
          loading="eager"
          src="/intro/logo_symbol.png"
          alt=""
          width={64}
          height={64}
          className="absolute"
          style={{ left: left + kids[1][0], top }}
        />
        <p
          className="absolute whitespace-nowrap text-[52px] font-extrabold leading-[1.19] tracking-[-0.03em] text-[#41BE8E]"
          style={{ left: left + kids[2][0], top: top + kids[2][1] }}
        >
          {INTRO_COPY.s13c}
        </p>
        <p
          className="absolute whitespace-nowrap text-[48px] font-medium leading-[1.19] tracking-[-0.03em] text-[#A3A8AD]"
          style={{ left: left + kids[3][0], top: top + kids[3][1] }}
        >
          {INTRO_COPY.s13d}
        </p>
      </Layer>
    </div>
  );
};

/* S14 민트 · 내 머리의 기록이, / 다음 스타일의 기준이 되다(한 글자씩) */
export const S14 = () => {
  const leadRef = useRef<HTMLDivElement>(null);
  const leadSpanRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useIntroScene(scenes.s14, (t) => {
    const s = s14(t);
    applyLayer(leadRef.current, s.lead);
    if (leadSpanRef.current) leadSpanRef.current.style.letterSpacing = `calc(-0.03em + ${s.leadTracking}px)`;
    s.chars.forEach((char, i) => applyLayer(charRefs.current[i], char));
  });
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#41BE8E]`}>
      <Text
        ref={leadRef}
        spanRef={leadSpanRef}
        text={INTRO_COPY.s14a}
        size={52}
        weight={400}
        color="#FFFFFF"
        align="center"
      />
      {S14_CHARS.map(({ char, x }, i) => (
        <Text
          key={`${char}-${x}`}
          ref={(node) => {
            charRefs.current[i] = node;
          }}
          text={char}
          size={104}
          weight={800}
          color="#FFFFFF"
          tracking={-20}
        />
      ))}
    </div>
  );
};

/* S15 원 → 심볼 → 워드마크 + QR(소개 페이지) + URL 바 */
export const S15 = () => {
  const circleRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLDivElement>(null);
  const rootRef = useIntroScene(scenes.s15, (t) => {
    const s = s15(t);
    applyLayer(circleRef.current, s.circle);
    applyLayer(symbolRef.current, s.symbol);
    const wordmark = wordmarkRef.current;
    if (wordmark) {
      applyLayer(wordmark, { x: 960, y: 370, opacity: s.wordmark.visible ? 100 : 0 });
      // 기준점 div는 크기가 0이라 이미지에 건다
      const img = wordmark.firstElementChild as HTMLElement | null;
      if (img) img.style.clipPath = `inset(-10% ${s.wordmark.right}% -10% ${s.wordmark.left}%)`;
    }
    applyLayer(qrRef.current, s.qr);
    applyLayer(titleRef.current, s.title);
    applyLayer(subRef.current, s.sub);
    applyLayer(urlRef.current, s.urlBar);
  });
  const { bar, bartxt } = INTRO_LAYOUT.s15;
  return (
    <div ref={rootRef} className={`${SCENE_CLASS} bg-[#F4F5F6]`}>
      <Layer ref={circleRef}>
        <div className="absolute left-[-90px] top-[-90px] size-[180px] rounded-full bg-[#41BE8E]/25" />
      </Layer>
      <Picture ref={wordmarkRef} src="logo_wordmark.png" srcWidth={2003} srcHeight={677} width={500} />
      <Picture ref={symbolRef} src="logo_symbol.png" srcWidth={1004} srcHeight={1004} width={300} />
      <Layer ref={qrRef}>
        <div
          className="absolute left-[-130px] top-[-130px] flex size-[260px] items-center justify-center rounded-[30px] bg-white"
          style={{ filter: dropShadow(colors.ink, 10, 20, 50) }}
        >
          {/* 포스터용 QR(https://heddy.site/download?src=poster) — store 없는 주소라 소개 페이지로 간다 */}
          <Image loading="eager" src="/intro/qr_download.png" alt="" width={212} height={212} />
        </div>
      </Layer>
      <Text ref={titleRef} text={INTRO_COPY.s15a} size={30} weight={700} color={colors.ink} />
      <Text ref={subRef} text={INTRO_COPY.s15b} size={20} weight={500} color="#8A9096" tracking={-20} />
      <Layer ref={urlRef}>
        <div
          className="absolute left-0 top-0 h-[68px] rounded-[14px] bg-[#E3E6E8] p-0.5"
          style={{ width: bar, filter: dropShadow("#000000", 5, 10, 30) }}
        >
          <div className="relative h-16 rounded-xl bg-white">
            <p className="absolute left-7 top-1/2 -translate-y-1/2 text-[26px] font-semibold leading-[1.19] text-[#1C1E20]">
              {INTRO_COPY.s15url}
            </p>
            <div
              className="absolute top-0 flex h-16 w-16 items-center justify-center rounded-r-xl bg-[#41BE8E]"
              style={{ left: bartxt }}
            >
              <Image loading="eager" src="/intro/icon_search.png" alt="" width={30} height={30} />
            </div>
          </div>
        </div>
      </Layer>
    </div>
  );
};
