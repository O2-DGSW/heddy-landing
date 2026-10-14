import Image from "next/image";

import { COPY, SOCIAL_LINKS } from "@/shared/config";

/**
 * 페이지 맨 아래 푸터(`docs/plans/0010`): 로고·저작권, 운영 주체·문의 메일, SNS.
 * 폰 레이어(z-40) 그림자가 덮지 않게 위에 둔다. 폰은 푸터가 올라오는 만큼 페이지와 함께 위로 빠진다.
 */
export const Footer = () => {
  const { footer } = COPY;
  return (
    <footer className="relative z-50 border-t border-[#E8E8E9] bg-white">
      <div className="flex flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-gutter">
        <div className="flex flex-col gap-3">
          <Image src="/brand/logo-wordmark.png" alt="Heddy" width={83} height={28} />
          <p className="text-12 text-[#76787A]">{footer.copyright}</p>
        </div>

        <dl className="text-14 flex flex-col gap-1 text-[#5A5C5D] lg:flex-row lg:gap-6">
          <div className="flex gap-2">
            <dt className="text-[#9A9C9D]">{footer.operatorLabel}</dt>
            <dd>{footer.operator}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#9A9C9D]">{footer.contactLabel}</dt>
            <dd>
              <a href={`mailto:${footer.contactEmail}`} className="hover:underline">
                {footer.contactEmail}
              </a>
            </dd>
          </div>
        </dl>

        <ul className="flex gap-4">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="block opacity-80 transition-opacity hover:opacity-100"
              >
                <Image src={`/brand/social/${link.key}.svg`} alt="" width={22} height={22} unoptimized />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};
