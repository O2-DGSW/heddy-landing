/**
 * 3D 씬 파일 미리 받기(이슈 #88). 예전엔 유휴 대기 → 폰 레이어 코드 → 런타임 → 씬 파일 순으로 이어져, 첫 화면 직후
 * 스크롤하면 3D가 늦게 떠 대체용 폰이 보였다가 바뀌고 초기화가 기록 모션과 겹쳤다. 첫 화면 직후 씬 파일을 바로 받아 두고,
 * 3D를 시작할 때 받은 데이터로 `Application.start`한다. 씬 파일은 캐시 헤더가 없어 따로 받아도 재사용되지 않으므로
 * 받은 데이터를 직접 넘긴다. 같은 씬은 한 번만 받고, 실패하면 다음 요청 때 다시 받는다.
 */
const scenes = new Map<string, Promise<ArrayBuffer>>();

export const preloadSplineScene = (url: string): Promise<ArrayBuffer> => {
  const cached = scenes.get(url);
  if (cached) return cached;
  const request = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Spline scene ${response.status}`);
    return response.arrayBuffer();
  });
  scenes.set(url, request);
  request.catch(() => scenes.delete(url));
  return request;
};

/** Spline 런타임 코드를 미리 받는다(같은 모듈이라 한 번만 받는다) */
export const preloadSplineRuntime = () => import("@splinetool/runtime");

/** Spline이 쓰는 Draco 압축 해제기(런타임이 씬을 해석한 뒤에야 요청한다) — 1년 캐시라 미리 받아 두면 캐시에서 나온다 */
const DRACO_DECODER = "https://www.gstatic.com/draco/versioned/decoders/1.5.2/";
let isDracoRequested = false;

export const preloadDracoDecoder = (): void => {
  if (isDracoRequested) return;
  isDracoRequested = true;
  for (const file of ["draco_wasm_wrapper.js", "draco_decoder.wasm"]) {
    fetch(`${DRACO_DECODER}${file}`).catch(() => undefined);
  }
};

/** 조건이 참인 동안 기다린다(50ms 간격, 최대 maxMs) — 화면이 미끄러지는 동안 무거운 3D 초기화를 미룬다 */
export const waitWhile = (isBusy: () => boolean, maxMs: number): Promise<void> =>
  new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (!isBusy() || Date.now() - started >= maxMs) resolve();
      else setTimeout(check, 50);
    };
    check();
  });

/** 테스트용 — 받아 둔 씬·압축 해제기 요청 기록을 비운다 */
export const resetSplinePreload = (): void => {
  scenes.clear();
  isDracoRequested = false;
};
