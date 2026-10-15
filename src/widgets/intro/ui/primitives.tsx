import type { CSSProperties, ReactNode, Ref } from "react";

import Image from "next/image";

import { INTRO } from "@/shared/config";

/**
 * 인트로 무대(1920×1080) 위 레이어 부품들. 각 부품의 바깥 div가 AE 레이어의 기준점(anchor)이고,
 * 프레임마다 `applyLayer`로 transform(위치·크기·회전)·opacity·filter(흐림)를 쓴다.
 * 안쪽 내용은 기준점 기준으로 놓여 있다(텍스트=기준선, 이미지·타일·폰=가운데, 상자=왼쪽 위).
 */

const ASSET = "/intro";

/** AE 그림자(색 · 불투명도 % · 거리 · 부드러움) → CSS drop-shadow(방향 180° = 아래) */
export const dropShadow = (color: string, opacity: number, distance: number, softness: number): string =>
  `drop-shadow(0 ${distance}px ${softness / 2}px ${hexToRgba(color, opacity / 100)})`;

const hexToRgba = (hex: string, alpha: number): string => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

interface LayerProps {
  ref?: Ref<HTMLDivElement>;
  /** 움직이지 않는 레이어의 자리(기준점 x, y) — 움직이는 레이어는 프레임마다 `applyLayer`로 쓴다 */
  position?: readonly [number, number];
  /** 처음 상태(첫 프레임 전) — 보통 숨김 */
  isHidden?: boolean;
  children: ReactNode;
  className?: string;
}

/** 기준점 div — 무대 왼쪽 위에 두고 transform으로 옮긴다 */
export const Layer = ({ ref, position, isHidden = true, children, className = "" }: LayerProps) => (
  <div
    ref={ref}
    className={`absolute left-0 top-0 origin-top-left will-change-transform ${isHidden ? "opacity-0" : ""} ${className}`}
    style={position ? { transform: `translate(${position[0]}px, ${position[1]}px)` } : undefined}
  >
    {children}
  </div>
);

interface TextProps {
  ref?: Ref<HTMLDivElement>;
  /** 글자 엘리먼트 — 자간 애니메이션(letter-spacing)을 쓸 때 */
  spanRef?: Ref<HTMLSpanElement>;
  text: string;
  size: number;
  weight: number;
  color: string;
  /** AE 자간(1/1000 em), 기본 -30 */
  tracking?: number;
  align?: "left" | "center" | "right";
  isHidden?: boolean;
}

const ALIGN_SHIFT = { left: "0%", center: "-50%", right: "-100%" } as const;

/** 텍스트 레이어 — 기준점은 기준선(정렬에 따라 왼쪽·가운데·오른쪽 끝) */
export const Text = ({
  ref,
  spanRef,
  text,
  size,
  weight,
  color,
  tracking = -30,
  align = "left",
  isHidden,
}: TextProps) => (
  <Layer ref={ref} isHidden={isHidden}>
    <span
      ref={spanRef}
      className="absolute left-0 top-0 whitespace-nowrap"
      style={{
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: `${tracking / 1000}em`,
        lineHeight: INTRO.lineHeight,
        transform: `translate(${ALIGN_SHIFT[align]}, ${-INTRO.baseline * size}px)`,
      }}
    >
      {text}
    </span>
  </Layer>
);

interface PictureProps {
  ref?: Ref<HTMLDivElement>;
  position?: readonly [number, number];
  src: string;
  /** 원본 크기(px) */
  srcWidth: number;
  srcHeight: number;
  /** 표시 폭(px) — 크기 100% */
  width: number;
  isHidden?: boolean;
  /** 이미지에 거는 그림자(CSS filter) */
  shadow?: string;
  className?: string;
}

/** 이미지 레이어 — 기준점은 이미지 가운데 */
export const Picture = ({
  ref,
  position,
  src,
  srcWidth,
  srcHeight,
  width,
  isHidden,
  shadow,
  className = "",
}: PictureProps) => {
  const height = (width * srcHeight) / srcWidth;
  return (
    <Layer ref={ref} position={position} isHidden={isHidden}>
      <Image
        src={`${ASSET}/${src}`}
        alt=""
        width={Math.round(width)}
        height={Math.round(height)}
        sizes={`${Math.round(width)}px`}
        loading="eager"
        className={`absolute max-w-none ${className}`}
        style={{ left: -width / 2, top: -height / 2, width, height, filter: shadow }}
      />
    </Layer>
  );
};

interface BoxProps {
  ref?: Ref<HTMLDivElement>;
  width: number;
  height: number;
  radius?: number;
  color: string;
  isHidden?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

/** 둥근 사각형 레이어 — 기준점은 왼쪽 위(AE box) */
export const Box = ({ ref, width, height, radius = 0, color, isHidden, style, children }: BoxProps) => (
  <Layer ref={ref} isHidden={isHidden}>
    <div
      className="absolute left-0 top-0"
      style={{ width, height, borderRadius: radius, background: color, ...style }}
    >
      {children}
    </div>
  </Layer>
);

export type TileIcon = "scissors" | "share" | "ar" | "rec";

interface TileProps {
  ref?: Ref<HTMLDivElement>;
  icon: TileIcon;
  /** 타일 한 변(px) */
  size: number;
  /** 타일 본체(그림자) — 강조 때 그림자를 진하게(`tileShadow`) */
  shadowRef?: Ref<HTMLDivElement>;
  isHidden?: boolean;
}

/** 기능 타일(민트 라운드 128 + 흰 아이콘 72, 민트 그림자) — 기준점은 가운데 */
export const Tile = ({ ref, icon, size, shadowRef, isHidden }: TileProps) => {
  const k = size / 128;
  return (
    <Layer ref={ref} isHidden={isHidden}>
      <div
        ref={shadowRef}
        className="absolute flex items-center justify-center bg-[#41BE8E]"
        style={{
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: 34 * k,
          filter: dropShadow(INTRO.colors.mint, 30, 18 * k, 40 * k),
        }}
      >
        <Image
          loading="eager"
          src={`${ASSET}/icon_${icon}.png`}
          alt=""
          width={Math.round(72 * k)}
          height={Math.round(72 * k)}
          unoptimized
          style={{ width: 72 * k, height: 72 * k }}
        />
      </div>
    </Layer>
  );
};

/** 타일 그림자 강도(%) — 기능 이름 강조 때 30 → 55 */
export const tileShadow = (size: number, opacity: number): string => {
  const k = size / 128;
  return dropShadow(INTRO.colors.mint, opacity, 18 * k, 40 * k);
};

interface PhoneProps {
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
  isHidden?: boolean;
}

/** 폰(426×898, 반경 64) 안 화면(402×874, 반경 52) — 기준점은 가운데. 그림자 INK 18% · 40 · 90 */
export const Phone = ({ ref, children, isHidden }: PhoneProps) => (
  <Layer ref={ref} isHidden={isHidden}>
    <div
      className="absolute left-[-213px] top-[-449px] h-[898px] w-[426px] rounded-[64px] bg-[#1C1E20]"
      style={{ filter: dropShadow(INTRO.colors.ink, 18, 40, 90) }}
    >
      <div className="absolute left-3 top-3 h-[874px] w-[402px] overflow-hidden rounded-[52px] bg-white">
        {children}
      </div>
    </div>
  </Layer>
);
