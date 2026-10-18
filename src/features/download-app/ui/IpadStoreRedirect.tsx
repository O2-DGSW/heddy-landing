"use client";

import { useEffect } from "react";

export interface IpadStoreRedirectProps {
  /** iPad가 갈 곳(`ipadDownloadHref`) — App Store 링크가 없으면 모바일 웹 */
  href: string;
}

/**
 * iPad는 데스크톱 UA(Macintosh)로 위장하지만 멀티터치를 지원한다.
 * PC용 QR 페이지가 아니라 App Store(링크가 없으면 모바일 웹)로 보낸다. PC 분기 안에서만 렌더할 것 —
 * 자기 자신(QR 페이지)으로 다시 오는 주소를 넘기면 무한 새로고침된다.
 */
export const IpadStoreRedirect = ({ href }: IpadStoreRedirectProps) => {
  useEffect(() => {
    const isIpad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    if (isIpad) {
      window.location.replace(href);
    }
  }, [href]);

  return null;
};
