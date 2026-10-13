import Image from "next/image";

import { COPY, downloadPath } from "@/shared/config";

export interface StoreButtonsProps {
  /** 유입 경로. `/download?src=` 값으로 그대로 들어간다 */
  source: string;
  tone?: "light" | "dark";
  /** `card`: 검정 카드에 작은 "다운로드" + 큰 스토어명(closing, `docs/plans/0010`) */
  variant?: "outline" | "card";
}

/** 카드형 버튼 로고 — App Store는 Apple 로고(Simple Icons, 흰색), 원스토어는 공식 사이트 아이콘(192px) */
const STORES = [
  { key: "appstore", label: COPY.storeButtons.appStore, icon: "/brand/stores/apple.svg" },
  { key: "onestore", label: COPY.storeButtons.oneStore, icon: "/brand/stores/onestore.png" },
] as const;

/** App Store / 원스토어 버튼. 스토어로 직접 링크하지 않고 `/download`를 거친다 */
export const StoreButtons = ({ source, tone = "light", variant = "outline" }: StoreButtonsProps) => {
  if (variant === "card") {
    return (
      <div className="flex flex-wrap gap-2">
        {STORES.map((store) => (
          <a
            key={store.key}
            href={downloadPath(source, store.key)}
            className="flex items-center gap-2 rounded-[10px] bg-[#0D0D0D] py-1.5 pl-3 pr-4 text-white transition-opacity hover:opacity-85"
          >
            <Image src={store.icon} alt="" width={22} height={22} unoptimized className="size-[22px]" />
            <span className="flex flex-col leading-[1.15]">
              <span className="text-[10px] text-white/60">{COPY.storeButtons.downloadLabel}</span>
              <span className="text-[15px] font-semibold tracking-[-0.02em]">{store.label}</span>
            </span>
          </a>
        ))}
      </div>
    );
  }

  const isDark = tone === "dark";
  const linkClassName = `text-14 rounded-DEFAULT border px-4 py-2 ${isDark ? "border-white text-white" : "border-black text-black"}`;

  return (
    <div className="flex gap-3">
      {STORES.map((store) => (
        <a key={store.key} href={downloadPath(source, store.key)} className={linkClassName}>
          {store.label}
        </a>
      ))}
    </div>
  );
};
