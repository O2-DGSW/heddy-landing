import { IntroStage } from "./IntroStage";
import { S05, S06, S07, S08 } from "./scenes/Records";
import { S09, S10, S11, S12 } from "./scenes/Features";
import { S13, S14, S15 } from "./scenes/Ending";
import { S01, S02, S03, S04 } from "./scenes/Opening";

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
    <S01 />
    <S02 />
    <S03 />
    <S04 />
    <S05 />
    <S06 />
    <S07 />
    <S08 />
    <S09 />
    <S10 />
    <S11 />
    <S12 />
    <S13 />
    <S14 />
    <S15 />
  </IntroStage>
);
