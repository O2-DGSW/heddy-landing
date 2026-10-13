import Image from "next/image";

/**
 * closing 섹션 홈 화면(`docs/plans/0010`) — 피그마 landing / home(1003:3048)을 3배로 내보낸 이미지.
 * 움직임이 없는 화면이라 HTML 대신 이미지로 쓴다(히어로 홈과 같은 방식). 피그마 프레임(402×874)과 폰 화면
 * 비율이 조금 달라 가운데 기준으로 채운다 — 위아래가 몇 px씩 잘린다. 히어로 홈(실제 앱 스크린샷)과는 다른 화면이다.
 */
export const ClosingHomeScreen = () => (
  <Image
    src="/screens/closing/home.webp"
    alt="헤디 홈 화면"
    fill
    loading="eager"
    sizes="560px"
    className="object-cover"
  />
);
