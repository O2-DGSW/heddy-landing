import type { ReactNode } from "react";

import type { SectionKey } from "@/shared/config";

export interface SectionShellProps {
  section: SectionKey;
  heightVh: number;
  eyebrow?: string;
  title: readonly string[];
  body?: readonly string[];
  children?: ReactNode;
}

/**
 * 섹션 공통 뼈대: `data-section` + 섹션 높이(vh) + sticky 100vh + 좌측 카피.
 * 폰은 그리지 않는다(폰은 `widgets/phone-stage`의 fixed 레이어가 전담).
 */
export const SectionShell = ({
  section,
  heightVh,
  eyebrow,
  title,
  body,
  children,
}: SectionShellProps) => {
  return (
    <section
      data-section={section}
      style={{ height: `${heightVh}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen flex-col items-start justify-start pt-[14vh] lg:flex-row lg:items-center lg:justify-start lg:pt-0">
        <div className="max-w-[85vw] px-6 lg:max-w-[40vw] lg:px-16">
          {eyebrow ? <p className="text-14 font-medium">{eyebrow}</p> : null}
          <h2 className="text-28 font-semibold lg:text-36">
            {title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          {body?.map((line) => (
            <p key={line} className="text-16">
              {line}
            </p>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
};
