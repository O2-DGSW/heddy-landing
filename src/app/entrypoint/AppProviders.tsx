"use client";

import type { ReactNode } from "react";

import { ScrollSceneProvider } from "@/shared/lib/scroll";

interface AppProvidersProps {
  children: ReactNode;
}

/** 전역 Provider 조합. 지금은 ScrollSceneProvider뿐이지만 늘어나면 여기서 합친다 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return <ScrollSceneProvider>{children}</ScrollSceneProvider>;
};
