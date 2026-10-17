"use client";

import { useContext, useEffect, useRef } from "react";

import { ScrollSceneContext } from "./ScrollSceneProvider";
import type { SceneFrame } from "./sceneFrame";

/** ScrollSceneProvider가 뿌리는 SceneFrame을 구독한다. setState 없이 ref로만 반영할 것 */
export const useSceneFrame = (onFrame: (frame: SceneFrame) => void): void => {
  const context = useContext(ScrollSceneContext);

  useEffect(() => {
    if (!context) return undefined;
    return context.subscribe(onFrame);
  }, [context, onFrame]);
};

/** DOM과 보간 모션 갱신이 모두 끝난 같은 프레임의 마지막에 캔버스를 그린다. */
export const useAfterSceneFrame = (onFrame: (frame: SceneFrame) => void): void => {
  const context = useContext(ScrollSceneContext);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);
  useEffect(() => {
    if (!context) return undefined;
    return context.subscribeAfterFrame((frame) => onFrameRef.current(frame));
  }, [context]);
};
