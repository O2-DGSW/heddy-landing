/**
 * `/download`로 들어온 요청을 랜딩페이지로 보낼지(이슈 #48). `store`가 없는 주소는 명함 뒷면에 인쇄된 QR
 * (`/download?src=header`)이라 서비스 소개(랜딩)를 먼저 보여 준다. 사이트 안 QR·휴대폰 헤더 버튼은
 * `store=auto`(OS별 스토어), 스토어 버튼은 `store=appstore|onestore`라 그대로 스토어로 간다.
 */
export const isLandingEntry = (store: string | null | undefined): boolean => !store;
