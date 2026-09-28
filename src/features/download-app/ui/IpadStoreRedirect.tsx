"use client";

import { useEffect } from "react";

import { downloadPath } from "@/shared/config";

/**
 * iPad는 데스크톱 UA(Macintosh)로 위장하지만 멀티터치를 지원한다.
 * PC용 QR 페이지가 아니라 App Store로 보낸다. PC 분기 안에서만 렌더할 것 —
 * "출시 준비 중" 화면에 두면 iPad가 계속 자기 자신으로 리다이렉트돼 무한 새로고침된다.
 */
export const IpadStoreRedirect = () => {
  useEffect(() => {
    const isIpad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    if (isIpad) {
      window.location.replace(downloadPath("ipad", "appstore"));
    }
  }, []);

  return null;
};
