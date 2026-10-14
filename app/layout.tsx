import type { Metadata } from "next";

import { AppProviders } from "@/app/entrypoint";

import "./globals.css";

export const metadata: Metadata = {
  title: "Heddy",
  description: "헤디 랜딩 페이지",
};

/**
 * Pretendard 가변 글꼴 — 화면에 쓰인 글자 범위만 받는 dynamic subset(이슈 #46). 렌더링을 막지 않게
 * media="print"로 받은 뒤 다 받으면 all로 바꾼다(그 전엔 시스템 글꼴, font-display: swap).
 */
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

const LOAD_FONT_CSS = `(function(){var l=document.getElementById("pretendard-css");if(!l)return;var on=function(){l.media="all"};if(l.sheet)on();else l.addEventListener("load",on)})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link id="pretendard-css" rel="stylesheet" href={PRETENDARD_CSS} media="print" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: LOAD_FONT_CSS }} />
        <noscript>
          <link rel="stylesheet" href={PRETENDARD_CSS} />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
