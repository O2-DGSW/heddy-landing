"use client";

import { useEffect, useId, useRef, useState } from "react";

import { COPY, downloadPath } from "@/shared/config";

import { DownloadQr } from "./DownloadQr";

/**
 * "앱 다운로드" 버튼. 터치 기기(`pointer: coarse`)에서는 팝오버 없이 바로 `/download`로 이동하고,
 * 마우스 기기에서는 QR과 설치 안내가 나란히 있는 팝오버를 연다. 닫기 버튼·바깥 클릭·ESC로 닫힌다.
 */
export const DownloadAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  const handleClick = (): void => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      window.location.href = downloadPath("header", "auto");
      return;
    }
    setIsOpen((prev) => !prev);
  };
  const handleClose = (): void => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    closeRef.current?.focus();

    const handleClickOutside = (event: MouseEvent): void => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? dialogId : undefined}
        className="bg-[#F2F3F6] px-3 py-2 rounded-lg leading-5 text-Label-Alternative font-medium"
      >
        {COPY.header.downloadButton}
      </button>
      {isOpen ? (
        <div
          id={dialogId}
          role="dialog"
          aria-label={COPY.header.downloadButton}
          data-native-scroll
          className="absolute right-0 top-full mt-3 flex w-[440px] max-w-[calc(100vw-48px)] items-end gap-6 rounded-[24px] border border-neutral-200 bg-[#F2F3F6] p-6 text-Label-Alternative shadow-xl"
        >
          <div className="shrink-0 rounded-sm bg-white p-1">
            <DownloadQr source="header" size={136} />
          </div>
          <p className="text-18 pb-1 font-medium leading-relaxed">
            {COPY.header.qrPopover.scanPrompt}
            <br />
            {COPY.header.qrPopover.installPrompt}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label={COPY.header.qrPopover.closeLabel}
            className="absolute right-6 top-6 flex size-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-neutral-200/60 transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
};
