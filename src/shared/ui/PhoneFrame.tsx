import { forwardRef, type ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  isVisible?: boolean;
  className?: string;
}

/** 폰 목업 프레임(300×615, radius 42) + 화면(inset 10px, radius 34). spec §2 고정 치수 */
export const PhoneFrame = forwardRef<HTMLDivElement, PhoneFrameProps>(function PhoneFrame(
  { children, isVisible = false, className = "" },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`absolute left-0 top-0 h-[615px] w-[300px] rounded-[42px] bg-phone-frame shadow-[0_40px_70px_-30px_rgba(13,13,13,.45)] ${isVisible ? "" : "invisible"} ${className}`}
    >
      <div className="absolute inset-[10px] overflow-hidden rounded-[34px] bg-phone-screen">{children}</div>
    </div>
  );
});
