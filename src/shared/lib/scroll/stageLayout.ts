import {
  PHONE,
  STAGE_LAYOUT,
  SECTION_HEIGHT_VH,
  SECTION_KEYS,
  type SectionKey,
} from "@/shared/config";

export type StageLayout = {
  scale: number;
  center: { x: number; y: number };
  isMobile: boolean;
  viewportWidth: number;
  viewportHeight: number;
};

export type SectionFrame = {
  key: SectionKey;
  top: number;
  height: number;
  end: number;
};

/** 뷰포트 크기로 폰 스테이지 스케일·중심을 구한다 (`docs/design/spec.md` §2) */
export const computeStageLayout = (
  viewportWidth: number,
  viewportHeight: number,
): StageLayout => {
  const isMobile = viewportWidth < STAGE_LAYOUT.desktop.breakpoint;

  if (isMobile) {
    const {
      scaleCap,
      scaleHeightRatio,
      scaleWidthDivisor,
      centerXRatio,
      centerYRatio,
    } = STAGE_LAYOUT.mobile;
    const scale = Math.min(
      scaleCap,
      (viewportHeight * scaleHeightRatio) / PHONE.height,
      viewportWidth / scaleWidthDivisor,
    );
    return {
      scale,
      center: {
        x: viewportWidth * centerXRatio,
        y: viewportHeight * centerYRatio,
      },
      isMobile: true,
      viewportWidth,
      viewportHeight,
    };
  }

  const {
    scaleCap,
    scaleHeightRatio,
    scaleWidthDivisor,
    centerXRatio,
    centerYOffset,
  } = STAGE_LAYOUT.desktop;
  const scale = Math.min(
    scaleCap,
    (viewportHeight * scaleHeightRatio) / PHONE.height,
    viewportWidth / scaleWidthDivisor,
  );
  return {
    scale,
    center: {
      x: viewportWidth * centerXRatio,
      y: viewportHeight / 2 + centerYOffset,
    },
    isMobile: false,
    viewportWidth,
    viewportHeight,
  };
};

/**
 * 섹션들을 순서대로 위→아래로 쌓는다(테스트용). `heightsPx`에 없는 섹션은
 * `SECTION_HEIGHT_VH` 기준값을 `viewportHeight`에 대한 vh로 환산해 채운다.
 */
export const stackSections = (
  heightsPx: Partial<Record<SectionKey, number>>,
  viewportHeight: number,
): SectionFrame[] => {
  let top = 0;
  return SECTION_KEYS.map((key) => {
    const height =
      heightsPx[key] ?? (SECTION_HEIGHT_VH[key] / 100) * viewportHeight;
    const frame: SectionFrame = { key, top, height, end: top + height };
    top += height;
    return frame;
  });
};
