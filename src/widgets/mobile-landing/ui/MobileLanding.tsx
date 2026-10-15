import type { CSSProperties, ReactNode } from "react";

import { COPY, TIMELINE, type SectionKey } from "@/shared/config";
import { Reveal, StoreButtons } from "@/shared/ui";

import { MOBILE_SECTIONS, type MobileSection } from "../model/mobileSections";
import { MobileVisualView } from "./MobileVisualView";

type SectionCopy = { eyebrow?: string; title: readonly string[]; body: readonly string[] };

const toLines = (value: string | readonly string[] | undefined): readonly string[] =>
  value === undefined ? [] : typeof value === "string" ? [value] : value;

/** 섹션 문구 — 데스크톱과 같은 `COPY.sections`. AR은 패널 문구를 제목, 카피를 본문으로 */
const copyOf = (key: SectionKey): SectionCopy => {
  const { sections } = COPY;
  switch (key) {
    case "hero":
    case "archive":
      return { title: sections[key].title, body: sections[key].body };
    case "record":
      return { eyebrow: sections.record.eyebrow, title: sections.record.title, body: sections.record.body };
    case "share":
      return {
        eyebrow: sections.share.eyebrow,
        title: sections.share.title,
        body: toLines(sections.share.body),
      };
    case "ar":
      return { eyebrow: sections.ar.eyebrow, title: sections.ar.panelCopy, body: sections.ar.copy };
    case "report":
    case "recommend":
      return { eyebrow: sections[key].eyebrow, title: sections[key].title, body: [] };
    default:
      return { title: sections[key].title, body: [] };
  }
};

/** 막대가 차례로 차오르는 간격·시작 지연(ms) — 문구가 떠오른 뒤 시작 */
const BAR_STAGGER_MS = 120;
const BAR_START_MS = 300;

/**
 * 리포트: 데스크톱 막대와 같은 지표 4개. 섹션이 화면에 들어오면(부모 `Reveal`의 data-revealed) 막대가 0에서
 * 점수만큼 차례로 차오른다(CSS transition, 이슈 #52). 동작 줄이기면 처음부터 찬 상태.
 */
const ReportMetrics = () => (
  <ul className="mt-6 flex flex-col gap-4">
    {COPY.sections.report.metrics.map(({ label, value }, i) => (
      <li key={label}>
        <div className="text-14 flex items-baseline justify-between">
          <span className="font-medium text-neutral-700">{label}</span>
          <span className="font-bold">{value}</span>
        </div>
        <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-[#EFEFEF]">
          <div
            className="h-full origin-left rounded-full bg-neutral-900 transition-transform duration-1000 ease-out [transform:scaleX(0)] group-data-[revealed=true]:[transform:scaleX(var(--bar))] motion-reduce:[transform:scaleX(var(--bar))] motion-reduce:transition-none"
            style={
              {
                "--bar": TIMELINE.report.barValues[i],
                transitionDelay: `${BAR_START_MS + i * BAR_STAGGER_MS}ms`,
              } as CSSProperties
            }
          />
        </div>
      </li>
    ))}
  </ul>
);

interface MobileSectionViewProps {
  section: MobileSection;
  intro?: ReactNode;
}

interface AppearProps {
  /** true면 처음부터 보인다 */
  isInstant: boolean;
  delayMs?: number;
  className?: string;
  children: ReactNode;
}

/** 첫 화면(히어로)은 처음부터 보인다 — 등장 효과를 걸면 가장 큰 이미지가 늦게 그려진다(LCP) */
const Appear = ({ isInstant, delayMs, className, children }: AppearProps) =>
  isInstant ? (
    <div className={className}>{children}</div>
  ) : (
    <Reveal delayMs={delayMs} className={className}>
      {children}
    </Reveal>
  );

const MobileSectionView = ({ section, intro }: MobileSectionViewProps) => {
  const { key, tone, visual } = section;
  const { eyebrow, title, body } = copyOf(key);
  const isDark = tone === "dark";
  const isHero = key === "hero";
  return (
    <section
      data-mobile-section={key}
      className={`px-5 ${isHero ? "pb-10 pt-28" : "py-16"} ${isDark ? "bg-[#0D0D0D] text-white" : ""}`}
    >
      <Appear isInstant={isHero} className="group">
        {eyebrow ? <p className="text-14 mb-2 font-bold text-main-50">{eyebrow}</p> : null}
        <h2 className="text-28 font-bold">
          {title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        {body.length > 0 ? (
          <p className={`text-16 mt-3 font-medium ${isDark ? "text-white/85" : "text-neutral-700"}`}>
            {body.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        ) : null}
        {key === "report" ? <ReportMetrics /> : null}
        {key === "closing" ? (
          <div className="mt-6">
            <StoreButtons source="closing" variant="card" />
          </div>
        ) : null}
      </Appear>
      <Appear isInstant={isHero} delayMs={120} className="mt-8">
        <MobileVisualView visual={visual} tone={tone} intro={intro} />
      </Appear>
    </section>
  );
};

/**
 * 모바일 랜딩(폭 1024px 미만, 이슈 #52) — toss.im 모바일처럼 섹션을 위에서 아래로 쌓는다. 데스크톱의 고정
 * 3D 폰·긴 고정 섹션 대신 섹션마다 정지 화면을 보여 주고, 화면에 들어올 때 살짝 떠오르는 효과만 쓴다.
 * 순서·문구는 데스크톱과 같다.
 */
interface MobileLandingProps {
  /** 히어로 자리 소개 애니메이션(인트로) — 위젯끼리 가져다 쓰지 않게 페이지가 넣어 준다 */
  intro?: ReactNode;
}

export const MobileLanding = ({ intro }: MobileLandingProps) => (
  <div className="lg:hidden">
    {MOBILE_SECTIONS.map((section) => (
      <MobileSectionView key={section.key} section={section} intro={intro} />
    ))}
  </div>
);
