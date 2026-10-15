import { describe, expect, it } from "vitest";

import { COPY, SEO, SOCIAL_LINKS } from "@/shared/config";

import { buildRobots, buildSitemap, buildStructuredData, SITE_METADATA } from "./seo";

describe("SEO 대표 주소(이슈 #68)", () => {
  it("검색용 대표 주소는 실제로 열리는 www 주소다(heddy.site는 www로 308 이동)", () => {
    expect(SEO.canonicalUrl).toBe("https://www.heddy.site");
  });
});

describe("buildRobots", () => {
  const robots = buildRobots();
  const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;

  it("모든 검색 로봇에 랜딩(/)을 열고, 리다이렉트(/download)·웹앱(/mobile)은 막는다", () => {
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(["/download", "/mobile"]);
  });

  it("사이트맵 주소를 알려 준다", () => {
    expect(robots.sitemap).toBe("https://www.heddy.site/sitemap.xml");
    expect(robots.host).toBe("https://www.heddy.site");
  });
});

describe("buildSitemap", () => {
  it("랜딩 한 쪽을 대표 주소로 싣는다", () => {
    const sitemap = buildSitemap();
    expect(sitemap.map((entry) => entry.url)).toEqual(["https://www.heddy.site/"]);
    expect(sitemap[0].priority).toBe(1);
  });
});

describe("SITE_METADATA", () => {
  it("제목에 브랜드(Heddy · 헤디)와 서비스 소개가, 설명은 기존 카피로만 들어간다", () => {
    const title = String(SITE_METADATA.title);
    expect(title).toContain("Heddy");
    expect(title).toContain("헤디");
    expect(title).toContain(COPY.sections.hero.body[0]);
    expect(SITE_METADATA.description).toContain(COPY.sections.hero.body[0]);
  });

  it("대표 주소(canonical)와 공유 미리보기(Open Graph)를 갖는다", () => {
    expect(SITE_METADATA.metadataBase?.toString()).toBe("https://www.heddy.site/");
    expect(SITE_METADATA.alternates?.canonical).toBe("/");
    const og = SITE_METADATA.openGraph as {
      url: string;
      siteName: string;
      locale: string;
      images: unknown[];
    };
    expect(og.url).toBe("/");
    expect(og.siteName).toBe("Heddy");
    expect(og.locale).toBe("ko_KR");
    expect(og.images).toHaveLength(1);
  });
});

describe("buildStructuredData (JSON-LD)", () => {
  const data = buildStructuredData();
  const graph = data["@graph"] as Array<Record<string, unknown>>;
  const byType = (type: string) => graph.find((node) => node["@type"] === type);

  it("WebSite에 브랜드 이름과 한글 이름(헤디)을 함께 둔다", () => {
    const site = byType("WebSite");
    expect(site?.name).toBe("Heddy");
    expect(site?.alternateName).toContain("헤디");
    expect(site?.url).toBe("https://www.heddy.site/");
  });

  it("Organization에 로고(절대 주소)·문의 메일·SNS를 둔다", () => {
    const org = byType("Organization");
    expect(org?.logo).toBe("https://www.heddy.site/brand/logo-symbol.png");
    expect(org?.email).toBe(COPY.footer.contactEmail);
    expect(org?.sameAs).toEqual(SOCIAL_LINKS.map((link) => link.href));
  });
});
