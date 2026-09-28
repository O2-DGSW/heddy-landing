import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/**
 * TODO(docs/plans/0001, TIMELINE.ar): pill 분할 → 다크 패널 → 패널 문구 → 카피 + 폰 재등장
 * → 스타일 3단 전환, 헤더 로고 숨김. 지금은 분할 문구/카피만.
 */
export const ArSection = () => {
  const { ar } = COPY.sections;
  return (
    <SectionShell section="ar" heightVh={SECTION_HEIGHT_VH.ar} title={ar.copy}>
      <p className="text-14 px-6">
        {ar.splitCopy[0]} / {ar.splitCopy[1]}
      </p>
      <p className="text-14 px-6">
        {ar.panelCopy[0]} {ar.panelCopy[1]}
      </p>
    </SectionShell>
  );
};
