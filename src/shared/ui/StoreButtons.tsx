import { COPY } from "@/shared/config";

export interface StoreButtonsProps {
  tone?: "light" | "dark";
}

/** Google Play / App Store 버튼 (closing 섹션, 헤더 QR 팝오버에서 재사용) */
export const StoreButtons = ({ tone = "light" }: StoreButtonsProps) => {
  const isDark = tone === "dark";
  const buttonClassName = `text-14 rounded-DEFAULT border px-4 py-2 ${isDark ? "border-white text-white" : "border-black text-black"}`;

  return (
    <div className="flex gap-3">
      <button type="button" className={buttonClassName}>
        {COPY.storeButtons.googlePlay}
      </button>
      <button type="button" className={buttonClassName}>
        {COPY.storeButtons.appStore}
      </button>
    </div>
  );
};
