"use client";

import { useId } from "react";

import { QRCodeSVG } from "qrcode.react";

import { downloadUrl } from "@/shared/config";

export interface DownloadQrProps {
  source: string;
  size?: number;
}

const LOGO_SCALE = 0.3; // 로고 한 변 = QR 한 변의 30%
const HALO_SCALE = 0.05; // 로고 실루엣 밖으로 번지는 흰 여백 두께(로고 크기 대비)
const HALO_MIN_RADIUS = 1.2; // size가 작아도 여백이 사라지지 않게 하는 최소 두께(px)

/**
 * 다운로드 QR. 오류 복원율 최대(H)로 만들어 가운데 로고를 얹어도 읽힌다.
 * 로고 뒤 흰 여백은 사각형이 아니라 캐릭터 실루엣을 따른다 — `logo-symbol.png`의 알파 채널을
 * SVG 필터로 살짝 팽창시켜 흰색으로 채운 halo를 깔고, 그 위에 브랜드 그린(`--main-50`)으로
 * 칠한 로고를 얹는다(QRCodeSVG의 사각형 excavate는 쓰지 않는다).
 */
export const DownloadQr = ({ source, size = 160 }: DownloadQrProps) => {
  const haloFilterId = useId();
  const tintFilterId = useId();
  const logoSize = size * LOGO_SCALE;
  const logoOffset = (size - logoSize) / 2;
  const haloRadius = Math.max(HALO_MIN_RADIUS, logoSize * HALO_SCALE);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <QRCodeSVG value={downloadUrl(source)} size={size} level="H" marginSize={0} />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <filter id={haloFilterId} x="-60%" y="-60%" width="220%" height="220%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={haloRadius} result="dilated" />
            <feComponentTransfer in="dilated" result="dilatedEdge">
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
            <feFlood floodColor="white" result="white" />
            <feComposite in="white" in2="dilatedEdge" operator="in" />
          </filter>
          <filter id={tintFilterId}>
            <feFlood floodColor="rgb(var(--main-50))" result="tintColor" />
            <feComposite in="tintColor" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
        <image
          href="/brand/logo-symbol.png"
          x={logoOffset}
          y={logoOffset}
          width={logoSize}
          height={logoSize}
          filter={`url(#${haloFilterId})`}
        />
        <image
          href="/brand/logo-symbol.png"
          x={logoOffset}
          y={logoOffset}
          width={logoSize}
          height={logoSize}
          filter={`url(#${tintFilterId})`}
        />
      </svg>
    </div>
  );
};
