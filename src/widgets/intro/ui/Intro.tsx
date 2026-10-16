"use client";

import { useRef, useState } from "react";

import dynamic from "next/dynamic";

import { introSceneIndices } from "../model/clock";
import { useIntroFrame } from "./IntroClock";
import { IntroStage } from "./IntroStage";
import { S01, S02, S03, S04 } from "./scenes/Opening";

const S05 = dynamic(() => import("./scenes/Records").then((module) => module.S05), { ssr: false });
const S06 = dynamic(() => import("./scenes/Records").then((module) => module.S06), { ssr: false });
const S07 = dynamic(() => import("./scenes/Records").then((module) => module.S07), { ssr: false });
const S08 = dynamic(() => import("./scenes/Records").then((module) => module.S08), { ssr: false });
const S09 = dynamic(() => import("./scenes/Features").then((module) => module.S09), { ssr: false });
const S10 = dynamic(() => import("./scenes/Features").then((module) => module.S10), { ssr: false });
const S11 = dynamic(() => import("./scenes/Features").then((module) => module.S11), { ssr: false });
const S12 = dynamic(() => import("./scenes/Features").then((module) => module.S12), { ssr: false });
const S13 = dynamic(() => import("./scenes/Ending").then((module) => module.S13), { ssr: false });
const S14 = dynamic(() => import("./scenes/Ending").then((module) => module.S14), { ssr: false });
const S15 = dynamic(() => import("./scenes/Ending").then((module) => module.S15), { ssr: false });

const SCENES = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15];

/** 장면이 바뀔 때만 렌더한다. 다음 장면의 코드·이미지를 미리 준비하고 지나간 DOM은 제거한다. */
const IntroScenes = () => {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  useIntroFrame((time) => {
    const [index] = introSceneIndices(time);
    if (currentRef.current === index) return;
    currentRef.current = index;
    setCurrent(index);
  });
  const next = (current + 1) % SCENES.length;
  return SCENES.map((Scene, index) =>
    index === current || index === next ? (
      <div key={index} data-intro-scene={index} className={index === current ? "contents" : "hidden"}>
        <Scene />
      </div>
    ) : null,
  );
};

/**
 * 첫 화면 소개 애니메이션(45초, 이슈 #70) — After Effects 키트 `Heddy_Intro45_Build.jsx`의 15개 장면을 코드로 옮겼다.
 * 문구는 `INTRO_COPY`, 장면 구간은 `INTRO.scenes`, 장면 안 키프레임은 `model/scenes/*`.
 */
interface IntroProps {
  /** 무대 크기(`IntroStage`) */
  className?: string;
}

export const Intro = ({ className }: IntroProps) => (
  <IntroStage className={className}>
    <IntroScenes />
  </IntroStage>
);
