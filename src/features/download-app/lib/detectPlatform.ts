export type Platform = "ios" | "android" | "desktop";

/** User-Agent로 플랫폼을 판별한다. 제조사·브라우저와 무관하게 OS만 본다 */
export const detectPlatform = (ua: string | null | undefined): Platform => {
  if (!ua) return "desktop";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};
