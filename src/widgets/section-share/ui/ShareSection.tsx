"use client";

import { useRef } from "react";

import { COPY, SECTION_HEIGHT_VH, TIMELINE } from "@/shared/config";
import { progressIn } from "@/shared/lib/motion";
import { useSceneFrame } from "@/shared/lib/scroll";
import { SectionShell } from "@/shared/ui";

/**
 * 시술기록 공유 섹션 카피. 폰 두 대(기록 공유 → QR → 미용실 폰 스캔 → 공유된 시술기록)는 phone-stage가
 * 그린다(`docs/plans/0009`). 부제는 공유가 끝날 무렵 나타난다(spec §5 share).
 */
export const ShareSection = () => {
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useSceneFrame((frame) => {
    if (!bodyRef.current) return;
    const shown = frame.isReducedMotion ? 1 : progressIn(frame.progress("share"), TIMELINE.share.subtitleIn);
    bodyRef.current.style.opacity = String(shown);
  });

  return (
    <SectionShell
      section="share"
      heightVh={SECTION_HEIGHT_VH.share}
      title={COPY.sections.share.title}
      footer={
        <p ref={bodyRef} className="text-16 mt-3 opacity-0">
          {COPY.sections.share.body}
        </p>
      }
    />
  );
};
