"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  /** 나타나기 시작을 늦출 시간(ms) — 같은 화면 안에서 차례로 */
  delayMs?: number;
  className?: string;
}

/**
 * 화면에 들어오면 한 번, 아래에서 살짝 떠오르며 나타난다(이슈 #52, toss.im 모바일 참고).
 * 스크롤 프레임마다 계산하지 않고 IntersectionObserver + CSS transition만 쓴다. 동작 줄이기면 바로 보인다.
 */
export const Reveal = ({ children, delayMs = 0, className = "" }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.dataset.revealed = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed="false"
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`translate-y-6 opacity-0 transition duration-700 ease-out data-[revealed=true]:translate-y-0 data-[revealed=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
};
