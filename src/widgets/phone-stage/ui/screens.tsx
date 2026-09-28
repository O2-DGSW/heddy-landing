import { COPY } from "@/shared/config";
import { MOCK_RECORDS, RecordRow } from "@/entities/record";

/** 홈 화면 (`docs/design/spec.md` §4) */
export const HomeScreen = () => {
  const { home } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <p className="text-14">{home.nextTreatmentDday}</p>
      <p className="text-20 font-semibold">{home.style}</p>
      <p className="text-14">{home.recommendedTiming}</p>
      <div>
        <p className="text-14 font-medium">{home.lastColorTitle}</p>
        <p className="text-12">
          {home.lastColor.tone} · {home.lastColor.level} · {home.lastColor.date}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <p className="text-14 font-medium">{home.recentRecordsTitle}</p>
        <p className="text-12">{home.totalRecordsLabel}</p>
      </div>
      <div className="flex flex-col gap-2">
        {MOCK_RECORDS.slice(-home.recentRecordsCount).map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
};

/** 기록 화면: 12행 리스트. 포커스 밴드 모션은 TODO(docs/plans/0001) */
export const RecordScreen = () => {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-14 font-medium">{COPY.phoneScreens.record.titleFor(MOCK_RECORDS.length)}</p>
      <div className="flex flex-col gap-3">
        {MOCK_RECORDS.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
};

/** 리포트 화면: 지표 막대 모션은 TODO(docs/plans/0001) */
export const ReportScreen = () => {
  const { report } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <p className="text-16 font-semibold">{report.title}</p>
      <p className="text-14">{report.subtitle}</p>
      <ul className="flex flex-col gap-2">
        {report.metrics.map((metric) => (
          <li key={metric} className="text-14">
            {metric}
          </li>
        ))}
      </ul>
      <p className="mt-auto text-12">{report.recommendedTiming}</p>
    </div>
  );
};

/** 추천 화면: 추천 근거 선 드로잉 모션은 TODO(docs/plans/0001) */
export const RecommendScreen = () => {
  const { recommend } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-14 font-medium">{recommend.title}</p>
      <p className="text-12">{recommend.subtitle}</p>
      <p className="text-20 font-semibold">{recommend.style}</p>
      <p className="text-14">{recommend.description}</p>
      <div className="flex flex-wrap gap-2">
        {recommend.tags.map((tag) => (
          <span key={tag} className="text-12 rounded-DEFAULT border px-2 py-1">
            {tag}
          </span>
        ))}
      </div>
      <ul className="text-12 flex flex-col gap-1">
        {recommend.basedOnRecords.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
      <p className="text-12 mt-auto">{recommend.footnote}</p>
    </div>
  );
};

/** AR 화면: pill 분할/다크 패널/스타일 전환 모션은 TODO(docs/plans/0001) */
export const ArScreen = () => {
  const { ar } = COPY.phoneScreens;
  return (
    <div className="bg-phone-frame flex h-full flex-col items-center justify-center gap-4 p-4 text-white">
      <p className="text-14">{ar.scanning}</p>
      <div className="flex gap-2">
        {ar.styles.map((style) => (
          <span key={style} className="text-12 rounded-DEFAULT border border-white/40 px-2 py-1">
            {style}
          </span>
        ))}
      </div>
    </div>
  );
};

/** QR 공유 화면: clip-path 모션은 TODO(docs/plans/0001) */
export const QrShareScreen = () => {
  const { qrShare } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-14 font-medium">{qrShare.title}</p>
      <p className="text-12">{qrShare.subtitle}</p>
      <div className="mx-auto my-4 h-[140px] w-[140px] rounded-DEFAULT border" aria-label="QR" />
      <p className="text-12">{qrShare.expiry}</p>
      <p className="text-12">{qrShare.sharedRecordsCount}</p>
      <p className="text-12">{qrShare.latestTreatment}</p>
    </div>
  );
};

/** 폰 B 스캔 화면 */
export const BScanScreen = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <p className="text-14">{COPY.phoneScreens.bScan.prompt}</p>
    </div>
  );
};

/** 폰 B 웹뷰 화면 */
export const BWebviewScreen = () => {
  const { bWebview } = COPY.phoneScreens;
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <p className="text-12">{bWebview.url}</p>
      <p className="text-12">{bWebview.noAppNeeded}</p>
      <p className="text-14 font-medium">{bWebview.ownerLabel}</p>
      <p className="text-12">
        {bWebview.recordCount} · {bWebview.dateRange}
      </p>
      <p className="text-12">{bWebview.latestTreatment}</p>
      <p className="text-12">{bWebview.productUsed}</p>
      <p className="text-12">{bWebview.developer}</p>
      <p className="text-12">{bWebview.hairCondition}</p>
    </div>
  );
};
