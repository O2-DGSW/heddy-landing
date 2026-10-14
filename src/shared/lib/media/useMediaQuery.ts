"use client";

import { useEffect, useState } from "react";

/**
 * 미디어 쿼리가 맞는지(이슈 #52). 서버 렌더·첫 렌더에선 false — 무거운 걸 켜는 쪽 판단에만 쓴다
 * (예: 데스크톱일 때만 3D 시작). 레이아웃 전환은 CSS(`lg:`)로 한다.
 */
export const useMediaQuery = (query: string): boolean => {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const handleChange = () => setIsMatch(list.matches);
    handleChange();
    list.addEventListener("change", handleChange);
    return () => list.removeEventListener("change", handleChange);
  }, [query]);

  return isMatch;
};
