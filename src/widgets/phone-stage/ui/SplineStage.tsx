"use client";

import { useRef } from "react";

import dynamic from "next/dynamic";
import type { Application, SPEObject } from "@splinetool/runtime";

import { PHONE_3D } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";

import { computePhones3D, type Pose3D, type Stage3D } from "../model/scene3d";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

interface SplineStageProps {
  sceneUrl: string;
  onReady: () => void;
}

type Stage3DObjects = { a: SPEObject; b: SPEObject; shadow?: SPEObject };

const DEG = Math.PI / 180;

const applyPose3D = (object: SPEObject, pose: Pose3D, stage: Stage3D): void => {
  object.position.x = stage.x + stage.k * pose.x;
  object.position.y = stage.y + stage.k * pose.y;
  object.position.z = stage.k * pose.z;
  object.rotation.x = pose.rotX * DEG;
  object.rotation.y = pose.rotY * DEG;
  object.rotation.z = pose.rotZ * DEG;
  const scale = PHONE_3D.baseScale * stage.k;
  object.scale.x = scale;
  object.scale.y = scale;
  object.scale.z = scale;
  object.visible = pose.isVisible;
};

/** 히어로 3D 폰(Spline 씬). 스크롤 프레임마다 `computePhones3D` 결과를 오브젝트에 직접 대입한다 */
export const SplineStage = ({ sceneUrl, onReady }: SplineStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<Stage3DObjects | null>(null);

  const handleLoad = (app: Application) => {
    const a = app.findObjectByName("PhoneA");
    const b = app.findObjectByName("PhoneB");
    if (!a || !b) return;
    objectsRef.current = { a, b, shadow: app.findObjectByName("ShadowCatcher") };
    onReady();
  };

  useSceneFrame((frame) => {
    const objects = objectsRef.current;
    const container = containerRef.current;
    if (!objects || !container) return;

    const scene = computePhones3D(frame);
    container.style.opacity = String(scene.canvasOpacity);
    applyPose3D(objects.a, scene.a, scene.stage);
    applyPose3D(objects.b, scene.b, scene.stage);

    if (objects.shadow) {
      objects.shadow.position.x = scene.stage.x;
      objects.shadow.position.y = scene.stage.y + scene.stage.k * PHONE_3D.shadowFloorY;
      objects.shadow.scale.x = scene.stage.k;
      objects.shadow.scale.y = scene.stage.k;
      objects.shadow.scale.z = scene.stage.k;
      objects.shadow.visible = scene.canvasOpacity > 0;
    }
  });

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 opacity-0">
      <Spline scene={sceneUrl} onLoad={handleLoad} />
    </div>
  );
};
