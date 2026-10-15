import type { Metadata, MetadataRoute } from "next";

import { COPY, SEO, SOCIAL_LINKS } from "@/shared/config";

const absolute = (path: string): string => new URL(path, SEO.canonicalUrl).toString();

const { hero, archive } = COPY.sections;
/** 제목: 브랜드(영문 · 한글) + 히어로 본문(서비스 소개 한 줄) */
const TITLE = `${SEO.siteName}(${SEO.alternateName}) | ${hero.body[0]}`;
/** 설명: 기존 카피만 잇는다(히어로 본문 + 아카이브 본문) — 카피는 지어내지 않는다 */
const DESCRIPTION = `${hero.body[0]}. ${archive.body.join(" ")}`;

/**
 * 루트 메타데이터(이슈 #68): 제목·설명, 대표 주소(canonical), 공유 미리보기(Open Graph·트위터 카드).
 * 구글 서치 콘솔 소유 확인 값은 환경변수 `GOOGLE_SITE_VERIFICATION`에 넣으면 메타 태그로 나간다.
 */
export const SITE_METADATA: Metadata = {
  metadataBase: new URL(SEO.canonicalUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SEO.siteName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SEO.siteName,
    locale: "ko_KR",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: SEO.ogImage.path, width: SEO.ogImage.width, height: SEO.ogImage.height, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SEO.ogImage.path],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/** robots.txt — 랜딩은 열고 다운로드·모바일 웹앱은 막는다. 사이트맵 주소를 알린다 */
export const buildRobots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/", disallow: [...SEO.disallow] },
  sitemap: absolute("/sitemap.xml"),
  host: SEO.canonicalUrl,
});

/** sitemap.xml — 랜딩 한 쪽 */
export const buildSitemap = (): MetadataRoute.Sitemap => [
  { url: absolute("/"), changeFrequency: "monthly", priority: 1 },
];

/** 구조화 데이터(JSON-LD): 사이트 이름(Heddy · 헤디)과 운영 조직(로고 · 문의 메일 · SNS) */
export const buildStructuredData = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SEO.siteName,
      alternateName: [SEO.alternateName],
      url: absolute("/"),
      inLanguage: "ko-KR",
    },
    {
      "@type": "Organization",
      name: SEO.siteName,
      alternateName: SEO.alternateName,
      url: absolute("/"),
      logo: absolute(SEO.logoPath),
      email: COPY.footer.contactEmail,
      sameAs: SOCIAL_LINKS.map((link) => link.href),
    },
  ],
});
