import { afterEach, describe, expect, it, vi } from "vitest";

import { preloadDracoDecoder, preloadSplineScene, resetSplinePreload, waitWhile } from "./splinePreload";

const URL_A = "https://prod.spline.design/a/scene.splinecode";

afterEach(() => {
  resetSplinePreload();
  vi.unstubAllGlobals();
});

describe("preloadSplineScene (첫 화면 직후 씬 파일 미리 받기, 이슈 #88)", () => {
  it("같은 씬은 한 번만 받고, 3D 시작 때 받아 둔 데이터를 그대로 쓴다", async () => {
    const buffer = new ArrayBuffer(8);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
    vi.stubGlobal("fetch", fetchMock);
    const first = preloadSplineScene(URL_A);
    const second = preloadSplineScene(URL_A);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    await expect(first).resolves.toBe(buffer);
  });

  it("받기에 실패하면 거부하고(대체용 폰으로), 다음 요청은 다시 받는다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(preloadSplineScene(URL_A)).rejects.toThrow();
    await expect(preloadSplineScene(URL_A)).resolves.toBeInstanceOf(ArrayBuffer);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("preloadDracoDecoder (압축 해제기 미리 받기)", () => {
  it("씬과 같이 바로 받아 캐시해 둔다(1년 캐시) — 씬을 받은 뒤 차례로 받지 않게, 한 번만", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    preloadDracoDecoder();
    preloadDracoDecoder();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://www.gstatic.com/draco/versioned/decoders/1.5.2/draco_wasm_wrapper.js",
      "https://www.gstatic.com/draco/versioned/decoders/1.5.2/draco_decoder.wasm",
    ]);
  });
});

describe("waitWhile (화면 이동 중엔 3D 초기화를 미룸)", () => {
  it("조건이 풀리면 바로, 최대 대기를 넘기면 그냥 진행한다", async () => {
    vi.useFakeTimers();
    let isBusy = true;
    let resolved = false;
    void waitWhile(() => isBusy, 2000).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(false);
    isBusy = false;
    await vi.advanceTimersByTimeAsync(60);
    expect(resolved).toBe(true);

    let timedOut = false;
    void waitWhile(() => true, 300).then(() => {
      timedOut = true;
    });
    await vi.advanceTimersByTimeAsync(350);
    expect(timedOut).toBe(true);
    vi.useRealTimers();
  });
});
