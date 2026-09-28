import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell, StoreButtons } from "@/shared/ui";

/** closing: 카피 + 스토어 버튼 + 저작권 */
export const ClosingSection = () => {
  return (
    <SectionShell section="closing" heightVh={SECTION_HEIGHT_VH.closing} title={COPY.sections.closing.title}>
      <div className="flex flex-col gap-4 px-6">
        <StoreButtons source="closing" />
        <p className="text-12">{COPY.sections.closing.copyright}</p>
      </div>
    </SectionShell>
  );
};
