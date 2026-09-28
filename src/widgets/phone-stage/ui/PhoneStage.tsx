"use client";

import { useRef, type ReactNode } from "react";

import { PHONE } from "@/shared/config";
import { useSceneFrame } from "@/shared/lib/scroll";
import { PhoneFrame } from "@/shared/ui";

import { computePhones, computeScreens } from "../model/scene";
import type { PhoneAScreenKey, PhoneBScreenKey, PhonePose } from "../model/scene";
import {
  ArScreen,
  BScanScreen,
  BWebviewScreen,
  HomeScreen,
  QrShareScreen,
  RecommendScreen,
  RecordScreen,
  ReportScreen,
} from "./screens";

const A_SCREENS: readonly { key: PhoneAScreenKey; node: ReactNode }[] = [
  { key: "home", node: <HomeScreen /> },
  { key: "record", node: <RecordScreen /> },
  { key: "report", node: <ReportScreen /> },
  { key: "recommend", node: <RecommendScreen /> },
  { key: "ar", node: <ArScreen /> },
  { key: "qrShare", node: <QrShareScreen /> },
];

const B_SCREENS: readonly { key: PhoneBScreenKey; node: ReactNode }[] = [
  { key: "ar", node: <ArScreen /> },
  { key: "scan", node: <BScanScreen /> },
  { key: "webview", node: <BWebviewScreen /> },
];

/** pose를 폰 프레임 엘리먼트의 transform/opacity에 그대로 반영한다. spec §2: translate(x-150,y-307.5) rotate(r) scale(S) */
const applyPose = (el: HTMLDivElement | null, pose: PhonePose): void => {
  if (!el) return;
  el.style.transform = `translate(${pose.x - PHONE.width / 2}px, ${pose.y - PHONE.pivot}px) rotate(${pose.rotate}deg) scale(${pose.scale})`;
  el.style.opacity = String(pose.opacity);
  el.classList.remove("invisible");
};

/** 폰 A·B가 모든 섹션 위에 떠 있는 fixed 레이어. 프레임마다 ref로만 갱신하고 setState는 쓰지 않는다 */
export const PhoneStage = () => {
  const phoneARef = useRef<HTMLDivElement>(null);
  const phoneBRef = useRef<HTMLDivElement>(null);
  const qrFlightRef = useRef<HTMLDivElement>(null);
  const aScreenRefs = useRef<Partial<Record<PhoneAScreenKey, HTMLDivElement | null>>>({});
  const bScreenRefs = useRef<Partial<Record<PhoneBScreenKey, HTMLDivElement | null>>>({});

  useSceneFrame((frame) => {
    const { a, b, qrFlight } = computePhones(frame);
    const screens = computeScreens(frame);

    applyPose(phoneARef.current, a);
    applyPose(phoneBRef.current, b);

    if (qrFlightRef.current) {
      qrFlightRef.current.style.transform = `translate(${qrFlight.x}px, ${qrFlight.y}px) rotate(${qrFlight.rotate}deg) scale(${qrFlight.scale})`;
      qrFlightRef.current.style.opacity = String(qrFlight.opacity);
    }

    (Object.keys(aScreenRefs.current) as PhoneAScreenKey[]).forEach((key) => {
      const node = aScreenRefs.current[key];
      if (node) node.style.opacity = String(screens.a[key]);
    });
    (Object.keys(bScreenRefs.current) as PhoneBScreenKey[]).forEach((key) => {
      const node = bScreenRefs.current[key];
      if (node) node.style.opacity = String(screens.b[key]);
    });
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <PhoneFrame ref={phoneBRef}>
        {B_SCREENS.map(({ key, node }) => (
          <div
            key={key}
            ref={(el) => {
              bScreenRefs.current[key] = el;
            }}
            className="absolute inset-0"
          >
            {node}
          </div>
        ))}
      </PhoneFrame>
      <PhoneFrame ref={phoneARef}>
        {A_SCREENS.map(({ key, node }) => (
          <div
            key={key}
            ref={(el) => {
              aScreenRefs.current[key] = el;
            }}
            className="absolute inset-0"
          >
            {node}
          </div>
        ))}
      </PhoneFrame>
      {/* QR 비행 오버레이: A→B 화면 사이를 포물선으로 이동 (§3, §5 share) */}
      <div
        ref={qrFlightRef}
        className="rounded-DEFAULT absolute left-0 top-0 h-10 w-10 border bg-white opacity-0"
      />
    </div>
  );
};
