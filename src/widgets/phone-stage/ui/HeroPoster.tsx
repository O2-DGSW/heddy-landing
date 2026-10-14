import type { Ref } from "react";

import { getImageProps } from "next/image";
import { preload } from "react-dom";

import { PHONE_3D, STAGE_LAYOUT } from "@/shared/config";

import { heroPosterCss } from "../model/scene3d";

/** 자리는 레이아웃 식에서 만든 CSS(min · vw · vh)라 JS 전 첫 페인트부터 3D 캔버스 자리와 같다 */
const POSTER_CSS = (() => {
  const mobile = heroPosterCss(true);
  const desktop = heroPosterCss(false);
  const rule = (rect: typeof mobile) =>
    `left:${rect.left};top:${rect.top};width:${rect.width};height:${rect.height};`;
  return `.hero-poster{${rule(mobile)}}@media (min-width:${STAGE_LAYOUT.desktop.breakpoint}px){.hero-poster{${rule(desktop)}}}`;
})();

interface HeroPosterProps {
  ref?: Ref<HTMLDivElement>;
}

/** 데스크톱에서만 쓴다 — 모바일은 쌓기 랜딩(평면 목업, 이슈 #52)이라 받지 않는다 */
const DESKTOP_MEDIA = `(min-width: ${STAGE_LAYOUT.desktop.breakpoint}px)`;

/**
 * 히어로 포스터(이슈 #46): Spline이 그리기 전, 서버 HTML에서 바로 보이는 히어로 3D 첫 화면 이미지.
 * 3D 캔버스가 다 나타나면 PhoneStage가 숨긴다 — 같은 그림이라 바뀌는 게 보이지 않는다.
 * 미리 받기는 데스크톱 미디어 조건으로만 걸고, 이미지는 lazy라 숨겨진(모바일) 경우엔 받지 않는다.
 */
export const HeroPoster = ({ ref }: HeroPosterProps) => {
  const { props } = getImageProps({
    src: PHONE_3D.posterImage.src,
    alt: "",
    fill: true,
    sizes: PHONE_3D.posterImage.sizes,
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "high",
    media: DESKTOP_MEDIA,
  });
  return (
    <div ref={ref} className="hero-poster absolute" aria-hidden="true">
      <style>{POSTER_CSS}</style>
      {/* getImageProps로 만든 next/image 속성 그대로 — 미리 받기에 미디어 조건을 달려고 <img>를 직접 쓴다 */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...props} loading="lazy" fetchPriority="high" className="object-contain" />
    </div>
  );
};
