"use client";

import { useRef } from "react";

import { AR_PANEL, COPY, SECTION_HEIGHT_VH } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computeArScene } from "../model/arScene";

/**
 * AR 섹션(`docs/design/spec.md` §5 ar, `docs/plans/0008`): "거울 앞에 | 앉기 전에" 사이 pill이 커져 화면을
 * 덮는 다크 패널이 되고, 패널 문구가 나왔다 사라진 뒤 카피가 들어온다. 폰(3D)은 phone-stage가 그린다.
 * 프레임마다 ref로 크기·transform·opacity만 쓴다.
 */
export const ArSection = () => {
  const { ar } = COPY.sections;
  const pillRef = useRef<HTMLDivElement>(null);
  const splitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const panelCopyRef = useRef<HTMLParagraphElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useSceneFrame((frame) => {
    const scene = computeArScene(frame);
    const pill = pillRef.current;
    if (pill) {
      pill.style.width = `${scene.pill.width}px`;
      pill.style.height = `${scene.pill.height}px`;
      pill.style.borderRadius = `${scene.pill.radius}px`;
      pill.style.opacity = String(scene.pill.opacity);
    }
    // 분할 문구: 데스크톱은 pill 좌우, 모바일은 위아래로 pill 가장자리 + gap만큼 밀려난다
    const [before, after] = splitRefs.current;
    const offset = scene.splitOffset;
    if (before) {
      before.style.transform = scene.isVertical
        ? `translate(calc(-100% - ${offset}px), -50%)`
        : `translate(-50%, calc(-100% - ${offset}px))`;
    }
    if (after) {
      after.style.transform = scene.isVertical
        ? `translate(${offset}px, -50%)`
        : `translate(-50%, ${offset}px)`;
    }
    if (panelCopyRef.current) {
      panelCopyRef.current.style.opacity = String(scene.panelCopy.opacity);
      panelCopyRef.current.style.transform = `translate(-50%, calc(-50% + ${scene.panelCopy.y}px))`;
    }
    if (copyRef.current) {
      copyRef.current.style.opacity = String(scene.copy.opacity);
      copyRef.current.style.transform = `translateY(${scene.copy.y}px)`;
    }
  });

  return (
    <section data-section="ar" style={{ height: `${SECTION_HEIGHT_VH.ar}vh` }} className="relative">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* pill → 다크 패널 */}
        <div
          ref={pillRef}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
          style={{ backgroundColor: AR_PANEL.color }}
        />

        {/* 분할 문구 "거울 앞에 | 앉기 전에" */}
        {ar.splitCopy.map((line, i) => (
          <span
            key={line}
            ref={(node) => {
              splitRefs.current[i] = node;
            }}
            className="text-20 absolute left-1/2 top-1/2 whitespace-nowrap font-bold text-neutral-900 lg:text-32"
          >
            {line}
          </span>
        ))}

        {/* 패널 문구: 다크 패널 가운데 */}
        <p
          ref={panelCopyRef}
          className="text-28 absolute left-1/2 top-1/2 whitespace-nowrap text-center font-bold text-white opacity-0 lg:text-44"
        >
          {ar.panelCopy.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>

        {/* 카피: 다른 섹션과 같은 자리(좌측, 모바일은 위) */}
        <div className="absolute inset-0 flex flex-col items-start justify-start pt-[10svh] lg:flex-row lg:items-center lg:pt-0">
          <div ref={copyRef} className="max-w-[85vw] px-6 opacity-0 lg:max-w-[50vw] lg:px-gutter">
            <h2 className="text-28 font-semibold text-white lg:text-44">
              {ar.copy.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};
