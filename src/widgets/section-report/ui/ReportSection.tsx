import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { SectionShell } from "@/shared/ui";

/** TODO(docs/plans/0001, TIMELINE.report): 지표 막대 3개 scaleX 스태거(섹션 카피 + 폰 화면 둘 다). 지금은 카피만 */
export const ReportSection = () => {
  return (
    <SectionShell
      section="report"
      heightVh={SECTION_HEIGHT_VH.report}
      title={COPY.sections.report.title}
    >
      <ul className="flex flex-col gap-2 px-6">
        {COPY.sections.report.metrics.map((metric) => (
          <li key={metric} className="text-16">
            {metric}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
};
