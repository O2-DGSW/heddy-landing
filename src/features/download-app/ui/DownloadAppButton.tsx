"use client";

import { useEffect, useRef, useState } from "react";

import { COPY } from "@/shared/config";
import { StoreButtons } from "@/shared/ui";

export interface DownloadAppButtonProps {
  tone?: "light" | "dark";
}

/** "앱 다운로드" 버튼 + QR 팝오버("휴대폰으로 스캔하세요" + 스토어 버튼). 바깥 클릭·ESC로 닫힌다 */
export const DownloadAppButton = ({
  tone = "light",
}: DownloadAppButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = (): void => setIsOpen((prev) => !prev);
  const handleClose = (): void => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        handleClose();
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const buttonClassName = `text-14 rounded-DEFAULT border px-4 py-2 ${tone === "dark" ? "border-white text-white" : "border-black text-black"}`;

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={handleToggle} className={buttonClassName}>
        {COPY.header.downloadButton}
      </button>
      {isOpen ? (
        <div className="rounded-DEFAULT absolute right-0 top-full mt-2 flex flex-col gap-3 border bg-white p-4">
          <p className="text-14">{COPY.header.qrPopover.scanPrompt}</p>
          <div className="h-[120px] w-[120px] border" aria-label="QR" />
          <StoreButtons />
        </div>
      ) : null}
    </div>
  );
};
