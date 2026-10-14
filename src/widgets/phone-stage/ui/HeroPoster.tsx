import type { Ref } from "react";

import Image from "next/image";

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

/**
 * 히어로 포스터(이슈 #46): Spline이 그리기 전, 서버 HTML에서 바로 보이는 히어로 3D 첫 화면 이미지.
 * 3D 캔버스가 다 나타나면 PhoneStage가 숨긴다 — 같은 그림이라 바뀌는 게 보이지 않는다.
 */
export const HeroPoster = ({ ref }: HeroPosterProps) => (
  <div ref={ref} className="hero-poster absolute" aria-hidden="true">
    <style>{POSTER_CSS}</style>
    <Image
      src={PHONE_3D.posterImage.src}
      alt=""
      fill
      priority
      sizes={PHONE_3D.posterImage.sizes}
      className="object-contain"
    />
  </div>
);
