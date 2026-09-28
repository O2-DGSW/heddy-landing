import { COPY, downloadPath } from "@/shared/config";

export interface StoreButtonsProps {
  /** 유입 경로. `/download?src=` 값으로 그대로 들어간다 */
  source: string;
  tone?: "light" | "dark";
}

/** App Store / 원스토어 버튼. 스토어로 직접 링크하지 않고 `/download`를 거친다 */
export const StoreButtons = ({ source, tone = "light" }: StoreButtonsProps) => {
  const isDark = tone === "dark";
  const linkClassName = `text-14 rounded-DEFAULT border px-4 py-2 ${isDark ? "border-white text-white" : "border-black text-black"}`;

  return (
    <div className="flex gap-3">
      <a href={downloadPath(source, "appstore")} className={linkClassName}>
        {COPY.storeButtons.appStore}
      </a>
      <a href={downloadPath(source, "onestore")} className={linkClassName}>
        {COPY.storeButtons.oneStore}
      </a>
    </div>
  );
};
