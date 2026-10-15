"use client";

import { useRef } from "react";

import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";
import { SectionShell } from "@/shared/ui";

import { computeReportBars } from "../model/reportBars";

/**
 * 지표 3줄(이름 · 값 · 막대). 막대는 스크롤에 따라 스태거로 차오른다(`docs/design/spec.md` §5).
 * 프레임마다 ref로 transform만 쓴다. TODO(docs/plans/0001): 폰 화면 막대
 */
export const ReportSection = () => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useSceneFrame((frame) => {
    computeReportBars(frame).forEach((scale, i) => {
      const bar = barRefs.current[i];
      if (bar) bar.style.transform = `scaleX(${scale})`;
    });
  });

  return (
    <SectionShell
      section="report"
      heightVh={SECTION_HEIGHT_VH.report}
      title={COPY.sections.report.title}
      // 막대는 모바일에서 숨긴다 — 커진 폰과 겹치고, 폰 화면 안 같은 막대가 같은 타이밍으로 찬다(이슈 #50)
      footer={
        <ul className="mt-10 hidden w-[min(80vw,420px)] flex-col gap-6 lg:flex">
          {COPY.sections.report.metrics.map(({ label, value }, i) => (
            <li key={label}>
              <div className="text-12 flex items-baseline justify-between lg:text-16">
                <span className="text-neutral-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
              <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-[#EFEFEF]">
                <div
                  ref={(node) => {
                    barRefs.current[i] = node;
                  }}
                  className="h-full origin-left rounded-full bg-neutral-900 will-change-transform"
                  // Tailwind scale-x-*는 별도 `scale` 속성이라 ref로 쓰는 transform과 곱해진다 → 초기값도 transform으로
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </li>
          ))}
        </ul>
      }
    />
  );
};
