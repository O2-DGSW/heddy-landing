/**
 * 검색 엔진 설정(이슈 #68). 대표 주소는 실제로 열리는 www 주소 — heddy.site는 www로 308 이동한다.
 * QR에 박히는 `SITE_URL`(heddy.site)과는 따로 둔다(QR 주소는 바꾸지 않는다).
 */
export const SEO = {
  canonicalUrl: "https://www.heddy.site",
  siteName: "Heddy",
  /** 한글 브랜드 이름 — "헤디"로 검색해도 찾게 */
  alternateName: "헤디",
  /** 공유 미리보기 이미지(1200×630, 히어로 화면) */
  ogImage: { path: "/og.png", width: 1200, height: 630 },
  logoPath: "/brand/logo-symbol.png",
  /** 검색 결과에 실리지 않게 막는 경로: 다운로드(스토어로 이동)·모바일 웹앱 */
  disallow: ["/download", "/mobile"],
} as const;
