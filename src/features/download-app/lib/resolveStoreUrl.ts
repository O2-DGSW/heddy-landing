import type { StoreKey } from "@/shared/config";

import type { Platform } from "./detectPlatform";

export type StoreEnv = { APP_STORE_URL?: string; ONE_STORE_URL?: string };

const STORE_KEYS: readonly StoreKey[] = ["appstore", "onestore"];

const isStoreKey = (value: string | null | undefined): value is StoreKey =>
  STORE_KEYS.includes(value as StoreKey);

const STORE_KEY_BY_PLATFORM: Partial<Record<Platform, StoreKey>> = {
  ios: "appstore",
  android: "onestore",
};

/** 링크가 아직 없으면 null(→ "출시 준비 중"). 우선순위: ?store= 지정 → 기기 OS → PC는 null */
export const resolveStoreUrl = (
  platform: Platform,
  store: string | null | undefined,
  env: StoreEnv,
): string | null => {
  const key = isStoreKey(store) ? store : STORE_KEY_BY_PLATFORM[platform];
  if (!key) return null;

  const url = key === "appstore" ? env.APP_STORE_URL : env.ONE_STORE_URL;
  return url ? url : null;
};
