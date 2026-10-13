import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell, StoreButtons } from "@/shared/ui";

/**
 * closing(`docs/plans/0010`): 카피 + 카드형 스토어 버튼, 저작권은 화면 아래.
 * 오른쪽 폰(홈 화면)은 phone-stage가 그린다.
 */
export const ClosingSection = () => {
  return (
    <SectionShell
      section="closing"
      heightVh={SECTION_HEIGHT_VH.closing}
      title={COPY.sections.closing.title}
      footer={
        <div className="mt-10">
          <StoreButtons source="closing" variant="card" />
        </div>
      }
    >
      <p className="text-12 absolute bottom-6 left-6 text-neutral-400 lg:left-16">
        {COPY.sections.closing.copyright}
      </p>
    </SectionShell>
  );
};
