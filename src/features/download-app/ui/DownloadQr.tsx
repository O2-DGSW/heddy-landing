"use client";

import { QRCodeSVG } from "qrcode.react";

import { downloadUrl } from "@/shared/config";

export interface DownloadQrProps {
  source: string;
  size?: number;
}

/** 다운로드 QR. 오류 복원율 최대(H)로 만들어 가운데 로고를 얹어도 읽힌다 */
export const DownloadQr = ({ source, size = 160 }: DownloadQrProps) => {
  return (
    <QRCodeSVG
      value={downloadUrl(source)}
      size={size}
      level="H"
      marginSize={0}
      imageSettings={{
        src: "/brand/logo-symbol.png",
        height: size * 0.22,
        width: size * 0.22,
        excavate: true,
      }}
    />
  );
};
