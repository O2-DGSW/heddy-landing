import type { Metadata } from "next";

import { AppProviders } from "@/app/entrypoint";
import { buildStructuredData, SITE_METADATA } from "@/app/seo";

import "./globals.css";

export const metadata: Metadata = SITE_METADATA;

/** 검색 엔진용 구조화 데이터(JSON-LD, 이슈 #68) — `<`를 이스케이프해 스크립트 밖으로 새지 않게 */
const STRUCTURED_DATA = JSON.stringify(buildStructuredData()).replace(/</g, "\\u003c");

/**
 * Pretendard 가변 글꼴 — 화면에 쓰인 글자 범위만 받는 dynamic subset(이슈 #46). 렌더링을 막지 않게
 * media="print"로 받은 뒤 다 받으면 all로 바꾼다(그 전엔 시스템 글꼴, font-display: swap).
 */
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

const LOAD_FONT_CSS = `(function(){var l=document.getElementById("pretendard-css");if(!l)return;var on=function(){l.media="all"};if(l.sheet)on();else l.addEventListener("load",on)})();`;

/**
 * 새로고침하면 항상 처음 화면(인트로)에서 시작한다(이슈 #92). 브라우저 스크롤 복원을 React보다 먼저 꺼서
 * 이전 위치로 돌아갔다가 튀는 일이 없게 한다. 이전 페이지가 복원을 켠 채 저장된 경우(배포 직후 첫 새로고침 등)엔
 * 브라우저가 load 무렵 다시 복원하므로, 그때까지 사용자가 직접 움직이지 않았으면 한 번 더 맨 위로 보낸다.
 */
const SCROLL_TO_TOP = `(function(){history.scrollRestoration="manual";window.scrollTo(0,0);var moved=false,ev=["wheel","touchstart","keydown","pointerdown"],mark=function(){moved=true};ev.forEach(function(t){addEventListener(t,mark,{once:true,passive:true})});addEventListener("load",function(){ev.forEach(function(t){removeEventListener(t,mark)});if(!moved)window.scrollTo(0,0)},{once:true})})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* media는 아래 스크립트가 React보다 먼저 print → all로 바꾸므로(의도) 이 속성 불일치 경고는 끈다 */}
        <link
          id="pretendard-css"
          rel="stylesheet"
          href={PRETENDARD_CSS}
          media="print"
          crossOrigin="anonymous"
          suppressHydrationWarning
        />
        <script dangerouslySetInnerHTML={{ __html: SCROLL_TO_TOP }} />
        <script dangerouslySetInnerHTML={{ __html: LOAD_FONT_CSS }} />
        <noscript>
          <link rel="stylesheet" href={PRETENDARD_CSS} />
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
