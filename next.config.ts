import type { NextConfig } from "next";

/**
 * heddy.site/mobile → heddy-app(모바일 웹, 별도 Vercel 프로젝트) 프록시 (`docs/plans/0006`).
 * 주소는 서버 환경변수에만 둔다. 예: `https://heddy-app.vercel.app` — heddy-app은 base `/mobile/`로
 * 빌드돼 자산을 `/mobile/assets/...`로 요청하고, 여기서 `/mobile`을 떼고 넘긴다.
 * 값이 없으면(로컬 개발 등) `/mobile`은 연결하지 않는다.
 */
const MOBILE_APP_ORIGIN = process.env.MOBILE_APP_ORIGIN?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!MOBILE_APP_ORIGIN) return [];
    return [{ source: "/mobile/:path*", destination: `${MOBILE_APP_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
