"use client";

import { useRef } from "react";

import { RECORD_CARDS } from "@/entities/record";
import { COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";
import { SectionShell } from "@/shared/ui";

import { computeRecordAside } from "../model/recordAside";

/**
 * 좌측 레일 + 큰 연·월(`docs/plans/0004`). 폰의 기록 카드 스택(phone-stage)과 같은 스텝으로
 * 움직인다. 프레임마다 ref로만 쓴다.
 */
export const RecordSection = () => {
  const railRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLSpanElement>(null);
  const prevDateRef = useRef<HTMLSpanElement>(null);
  const dateBoxRef = useRef<HTMLParagraphElement>(null);

  useSceneFrame((frame) => {
    const aside = computeRecordAside(frame, RECORD_CARDS);

    if (railRef.current) railRef.current.style.transform = `scaleY(${aside.railScale})`;
    if (dateBoxRef.current) dateBoxRef.current.style.color = `rgb(${aside.dateColor.join(",")})`;

    // 직전 날짜는 위로 빠지고 새 날짜가 아래에서 올라온다(폰 카드가 돌며 들어오는 것과 같은 진행도)
    if (dateRef.current) {
      if (dateRef.current.textContent !== aside.date) dateRef.current.textContent = aside.date;
      dateRef.current.style.transform = `translateY(${(1 - aside.roll) * 100}%)`;
      dateRef.current.style.opacity = String(aside.roll);
    }
    if (prevDateRef.current) {
      const prev = aside.prevDate ?? "";
      if (prevDateRef.current.textContent !== prev) prevDateRef.current.textContent = prev;
      prevDateRef.current.style.transform = `translateY(${-aside.roll * 100}%)`;
      prevDateRef.current.style.opacity = String(1 - aside.roll);
    }
  });

  return (
    <SectionShell
      section="record"
      heightVh={SECTION_HEIGHT_VH.record}
      eyebrow={COPY.sections.record.eyebrow}
      title={COPY.sections.record.title}
      body={COPY.sections.record.body}
      footer={
        <p
          ref={dateBoxRef}
          className="relative mt-10 overflow-hidden text-[clamp(56px,7vw,104px)] font-bold leading-[1.15] tracking-[-0.04em] tabular-nums"
        >
          {/* 자리 잡기용(보이지 않음) — 날짜 폭이 바뀌어도 레이아웃이 흔들리지 않게 */}
          <span className="invisible">0000.00</span>
          <span ref={prevDateRef} aria-hidden="true" className="absolute left-0 top-0" />
          <span ref={dateRef} className="absolute left-0 top-0">
            {RECORD_CARDS[0].date}
          </span>
        </p>
      }
    >
      <div
        aria-hidden="true"
        className="absolute bottom-[18vh] left-6 top-[18vh] hidden w-px bg-neutral-200 lg:left-8 lg:block"
      >
        <div ref={railRef} className="h-full w-full origin-top bg-neutral-900" />
      </div>
    </SectionShell>
  );
};
