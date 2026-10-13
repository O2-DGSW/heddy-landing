import Image from "next/image";

import { MOCK_RECORDS } from "@/entities/record";
import { COPY, PHONE } from "@/shared/config";

const { home } = COPY.phoneScreens;
const ASSET = "/screens/closing";
/** 화면을 짜는 기준 폭(px) — 다른 피그마 화면과 같은 402로 짜고 화면 폭에 맞춰 줄인다 */
const DESIGN_WIDTH = 402;
/** 최근 기록 행 썸네일 색(최신 순) — 레퍼런스 이미지의 머리색 견본 */
const SWATCH_COLORS = ["#6A5B49", "#4F4339", "#7F6C57"] as const;

const RECENT_RECORDS = MOCK_RECORDS.slice(-home.recentRecordsCount).reverse();

interface ClosingHomeScreenProps {
  /** 화면 크기(px). CSS 폰은 `PHONE.screenWidth/Height`, 3D 폰 화면 오버레이는 `PHONE_3D.screen` */
  width?: number;
  height?: number;
}

/**
 * closing 섹션 홈 화면(`docs/plans/0010`) — 레퍼런스 이미지대로 다음 시술 D-day, 지난 컬러 카드, 최근 기록
 * 3건을 보여 준다. 문구는 원본 디자인 홈 화면(spec §4) 그대로다. 히어로 홈(실제 앱 스크린샷)과는 다른 화면이다.
 */
export const ClosingHomeScreen = ({
  width = PHONE.screenWidth,
  height = PHONE.screenHeight,
}: ClosingHomeScreenProps) => {
  const scale = width / DESIGN_WIDTH;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#FBFBFB]">
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: DESIGN_WIDTH, height: height / scale, transform: `scale(${scale})` }}
      >
        <p className="absolute left-[36px] top-[22px] text-[17px] font-semibold leading-[22px] text-black">
          {home.statusTime}
        </p>

        <Image
          src="/brand/logo-wordmark.png"
          alt="heddy"
          width={83}
          height={28}
          className="absolute left-[27px] top-[78px]"
        />

        <div className="absolute left-[27px] top-[134px] flex flex-col tracking-[-0.02em]">
          <p className="text-[16px] leading-[1.3] text-[#76787A]">{home.nextTreatmentLabel}</p>
          <p className="mt-[6px] text-[44px] font-bold leading-[1.1] text-[#111111]">
            {home.nextTreatmentDday}
          </p>
          <p className="mt-[8px] text-[15px] leading-[1.3] text-[#76787A]">
            {home.style} · {home.recommendedTiming}
          </p>
        </div>

        {/* 지난 컬러 카드 */}
        <div className="absolute left-[27px] top-[265px] flex h-[95px] w-[348px] items-center gap-[16px] rounded-[20px] border border-[#EEEEEE] bg-white px-[17px] tracking-[-0.02em]">
          <Image src={`${ASSET}/croc.png`} alt="" width={62} height={62} />
          <div className="flex flex-col gap-[4px]">
            <p className="text-[16px] font-bold leading-[1.3] text-[#111111]">{home.lastColorTitle}</p>
            <p className="text-[13px] leading-[1.3] text-[#8A8C8E]">
              {home.lastColor.tone} · {home.lastColor.level} · {home.lastColor.date}
            </p>
          </div>
        </div>

        {/* 최근 기록 */}
        <div className="absolute left-[27px] top-[386px] flex w-[348px] items-center justify-between tracking-[-0.02em]">
          <p className="text-[16px] font-bold leading-[1.3] text-[#111111]">{home.recentRecordsTitle}</p>
          <p className="text-[14px] leading-[1.3] text-[#8A8C8E]">{home.totalRecordsLabel}</p>
        </div>
        <ul className="absolute left-[27px] top-[423px] flex flex-col gap-[14px] tracking-[-0.02em]">
          {RECENT_RECORDS.map((record, index) => (
            <li key={record.id} className="flex items-center gap-[15px]">
              <span
                aria-hidden="true"
                className="size-[58px] rounded-[12px]"
                style={{ backgroundColor: SWATCH_COLORS[index] }}
              />
              <span className="flex flex-col">
                <span className="text-[16px] font-bold leading-[1.3] text-[#111111]">{record.title}</span>
                <span className="text-[14px] leading-[1.3] text-[#8A8C8E]">{record.date}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
