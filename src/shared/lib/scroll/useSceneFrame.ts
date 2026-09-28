"use client";

import { useContext, useEffect } from "react";

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
