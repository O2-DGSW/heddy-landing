import { TIMELINE } from "@/shared/config";
import { progressIn } from "@/shared/lib/motion";
import type { SceneFrame } from "@/shared/lib/scroll";

/**
 * AR 섹션 다크 패널이 헤더 자리를 덮고 있는지(`docs/design/spec.md` §5 ar, `docs/plans/0008`).
 * pill이 화면을 거의 다 덮은 뒤(확대 진행도 > 임계값)부터 섹션이 위로 다 빠질 때까지(ar.end) 맞다.
 * 이미 본 AR은 결과(다크 패널)가 남아 있지만, 섹션이 헤더 자리에 닿기(ar.top) 전엔 아니다(이슈 #89).
 */
export const isHeaderOverDarkPanel = (frame: SceneFrame): boolean => {
  const ar = frame.sections.find((section) => section.key === "ar");
  if (!ar || frame.scrollY < ar.top || frame.scrollY > ar.end) return false;
  return progressIn(frame.progress("ar"), TIMELINE.ar.pillMorph) > TIMELINE.ar.darkPanelHeaderHideThreshold;
};
