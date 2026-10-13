import { COPY, downloadPath } from "@/shared/config";

export interface StoreButtonsProps {
  /** 유입 경로. `/download?src=` 값으로 그대로 들어간다 */
  source: string;
  tone?: "light" | "dark";
  /** `card`: 검정 카드에 작은 "다운로드" + 큰 스토어명(closing, `docs/plans/0010`) */
  variant?: "outline" | "card";
}

const STORES = [
  { key: "appstore", label: COPY.storeButtons.appStore },
  { key: "onestore", label: COPY.storeButtons.oneStore },
] as const;

/** App Store / 원스토어 버튼. 스토어로 직접 링크하지 않고 `/download`를 거친다 */
export const StoreButtons = ({ source, tone = "light", variant = "outline" }: StoreButtonsProps) => {
  if (variant === "card") {
    return (
      <div className="flex flex-wrap gap-3">
        {STORES.map((store) => (
          <a
            key={store.key}
            href={downloadPath(source, store.key)}
            className="flex flex-col rounded-[14px] bg-[#0D0D0D] px-5 py-2.5 text-white transition-opacity hover:opacity-85 lg:rounded-[16px] lg:px-[30px] lg:py-[12px]"
          >
            <span className="text-12 text-white/60">{COPY.storeButtons.downloadLabel}</span>
            <span className="text-16 font-bold lg:text-20">{store.label}</span>
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
