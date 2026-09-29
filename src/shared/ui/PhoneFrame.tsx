import { forwardRef, type ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  isVisible?: boolean;
  className?: string;
}

/**
 * 폰 목업 프레임(300×615, radius 42) + 화면(inset 10px, radius 34). spec §2 고정 치수.
 * 바깥 div(ref)는 `PhoneStage`의 `applyPose`가 매 프레임 transform/opacity를 직접 덮어쓰는
 * pose 캐리어라 위치만 차지하고 시각 스타일이 없다 — 베젤·노치·버튼·3D 틸트는 전부 안쪽
 * "디바이스 바디" 레이어(스크롤과 무관한 고정 transform)에 둬서 pose 로직과 분리한다.
 */
export const PhoneFrame = forwardRef<HTMLDivElement, PhoneFrameProps>(function PhoneFrame(
  { children, isVisible = false, className = "" },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`absolute left-0 top-0 h-[615px] w-[300px] ${isVisible ? "" : "invisible"} ${className}`}
    >
      <div className="[transform:perspective(900px)_rotateX(8deg)] relative h-full w-full rounded-[42px] bg-[linear-gradient(155deg,color-mix(in_srgb,rgb(var(--phone-frame)),white_16%)_0%,rgb(var(--phone-frame))_45%,color-mix(in_srgb,rgb(var(--phone-frame)),black_25%)_100%)] shadow-[0_40px_70px_-30px_rgba(13,13,13,.45),inset_0_1px_1px_rgba(255,255,255,.18),inset_0_-1px_2px_rgba(0,0,0,.4)]">
        {/* 측면 버튼 */}
        <div className="absolute -left-[2px] top-[110px] h-[28px] w-[3px] rounded-l-full bg-black/25" />
        <div className="absolute -left-[2px] top-[150px] h-[46px] w-[3px] rounded-l-full bg-black/25" />
        <div className="absolute -right-[2px] top-[130px] h-[60px] w-[3px] rounded-r-full bg-black/25" />
        <div className="absolute inset-[10px] overflow-hidden rounded-[34px] bg-phone-screen">
          {children}
          {/* 유리 반사 하이라이트 */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.16)_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0)_75%,rgba(255,255,255,.08)_100%)]" />
        </div>
        {/* 카메라 노치: 화면(opaque) 위에 그려져야 해서 스크린 div 뒤가 아니라 앞에 둔다 */}
        <div className="pointer-events-none absolute left-1/2 top-[14px] h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-black/70" />
      </div>
    </div>
  );
});
