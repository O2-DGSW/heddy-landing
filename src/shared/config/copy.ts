/**
 * 카피 단일 출처 (`docs/design/spec.md` §1, §4). 새 카피가 필요하면 지어내지 말고 물어본다.
 */
export const COPY = {
  header: {
    downloadButton: "앱 다운로드",
    qrPopover: {
      scanPrompt: "휴대폰으로 스캔하세요",
    },
  },
  sections: {
    hero: {
      title: ["내 머리의 기록이,", "다음 스타일의 기준이 되다"],
      body: ["펌·컬러·시술 사진을 한 곳에 기록하고,", "AI 분석과 AR 프리뷰로 다음 스타일을 미리 확인하세요."],
    },
    archive: {
      title: ["흩어진 기록이,", "한 화면으로"],
      body: ["갤러리, 메모, 카톡에 흩어져 있던 시술 기록을", "헤디 하나에 모았어요."],
    },
    record: {
      eyebrow: "01 — 시술기록 저장",
      title: ["한 번의 시술이,", "한 장의 기록으로"],
      body: ["사진 몇 장이면 기록이 끝납니다.", "스크롤을 내릴수록 기록이 시간순으로 쌓여요."],
    },
    report: {
      title: ["12번의 기록이,", "나를 설명합니다"],
      /**
       * 막대 행: 폰 상세 화면(다운펌 분석완료)의 "상태 지표" 4개와 같은 문구(2026-10-10, 사용자 요청).
       * 막대 길이는 `TIMELINE.report.barValues`(점수 비례).
       */
      metrics: [
        { label: "색 균일도", value: "78점 · 신뢰도 상" },
        { label: "볼륨 균형", value: "64점 · 신뢰도 중" },
        { label: "형태 대칭성", value: "71점 · 신뢰도 상" },
        { label: "거칠기 징후", value: "41점 · 신뢰도 하" },
      ],
    },
    recommend: {
      title: ["검색이 아니라,", "기록에서 시작하는 추천"],
    },
    ar: {
      splitCopy: ["거울 앞에", "앉기 전에"],
      panelCopy: ["머릿속 상상을 지우고", "이제는 눈앞의 결과로"],
      copy: ["거울 앞에 앉기 전에,", "먼저 비춰보세요"],
    },
    share: {
      title: ["미용실에서", "설명 없이"],
      body: "기록이 나를 대신해 설명합니다",
    },
    closing: {
      title: ["다음 시술 전에,", "헤디에 기록부터"],
      copyright: "© 2026 Heddy",
    },
  },
  storeButtons: {
    appStore: "App Store",
    oneStore: "원스토어",
  },
  phoneScreens: {
    home: {
      nextTreatmentDday: "다음 시술까지 D-12",
      style: "레이어드 C컬펌",
      recommendedTiming: "10월 첫째 주 권장",
      lastColorTitle: "지난 컬러, 헤디가 기억해요",
      lastColor: { tone: "애쉬브라운", level: "6레벨", date: "2026.09" },
      recentRecordsTitle: "최근 기록",
      recentRecordsCount: 3,
      totalRecordsLabel: "전체 12",
    },
    record: {
      /** 시술 기록 N건 */
      titleFor: (count: number): string => `시술 기록 ${count}건`,
    },
    report: {
      title: "헤어 리포트",
      subtitle: "12번의 기록 분석",
      metrics: ["모발 손상도 낮음", "선호 톤 애쉬 계열", "시술 주기 평균 7주"],
      recommendedTiming: "다음 시술 권장 10월 첫째 주",
    },
    /** 피그마 landing / S6-스타일추천 문구 그대로(`docs/plans/0007`) */
    recommend: {
      statusTime: "9:41",
      title: "스타일 추천",
      topTitle: "추천 결과 Top 3",
      basisTag: "이력 기반",
      arCta: "AR로 체험",
      cards: [
        {
          rank: "1순위",
          style: "가르마 댄디컷",
          reason: "근거: 다운펌 이력과 유사",
          reference: "참고기록: 2026-07-18 염색 기록",
        },
        {
          rank: "2순위",
          style: "가르마 애즈펌",
          reason: "근거: 시스루 애즈펌 이력과 유사",
          reference: "참고기록: 2026-05-12 염색 기록",
        },
        {
          rank: "3순위",
          style: "시스루 애즈펌",
          reason: "근거: 시스루 댄디컷 이력과 유사",
          reference: "참고기록: 2025-12-18 염색 기록",
        },
      ],
      basisTitle: "추천 근거 데이터",
      basis: [
        { label: "시술 이력", value: "4건 · 최고 만족도 5점" },
        { label: "AR 후보 스타일", value: "3건" },
        { label: "선호 | 제외 태그", value: "선호 4개 · 제외 2개" },
        { label: "현재 머리", value: "숏컷 · 펌" },
        { label: "관리 가능 시간", value: "하루 10분 이하" },
      ],
      tabs: ["홈", "기록", "AR", "추천", "프로필"],
    },
    /** 피그마 landing / S5-AR화면1·2·3 문구 그대로(`docs/plans/0008`) */
    ar: {
      statusTime: "9:41",
      scanning: "얼굴 인식 중",
      styles: ["일자 풀뱅 - 내추럴 블랙", "다운펌 - 내추럴 블랙", "가르마 댄디컷 - 내추럴 블랙"],
      tabs: ["홈", "기록", "추천", "프로필"],
    },
    /** 피그마 landing / S4-공유화면 · S4-공유QR화면 · S3-시술기록 공유 문구 그대로(`docs/plans/0009`) */
    shareSettings: {
      statusTime: "9:41",
      title: "기록 공유",
      sectionTitle: "공유 항목",
      rows: ["사진", "시술 내용", "만족도", "AR 후보 스타일 함께 공유"],
      cancel: "취소",
      createLink: "공유 링크 생성",
      tabs: ["홈", "기록", "AR", "추천", "프로필"],
    },
    shareQr: {
      title: "다운펌",
      tabs: ["정보", "분석 완료"],
      photoTitle: "사진",
      infoTitle: "시술 정보",
      info: [
        { label: "시술 날짜", value: "2026-07-18" },
        { label: "미용실", value: "준오헤어 강남점" },
        { label: "담당 디자이너", value: "오용준" },
        { label: "시술 종류", value: "염색" },
        { label: "시술 내용", value: "애쉬브라운 전체 염색" },
        { label: "소요 시간", value: "2시간 30분" },
        { label: "금액", value: "120,000원" },
      ],
      modalTitle: "공유",
      linkLabel: "공유 링크",
      link: "https://heddy.site/...",
    },
    sharedRecord: {
      title: "공유된 시술기록",
      sharedBy: "장강민님이 공유했어요",
      photoTitle: "사진",
      infoTitle: "시술 정보",
      info: [
        { label: "시술 날짜", value: "2026년 9월 18일" },
        { label: "미용실", value: "준오 헤어 강남점" },
        { label: "담당 디자이너", value: "오용준" },
        { label: "시술 종류", value: "펌" },
      ],
      ratingLabel: "만족도",
      expiry: "2026년 10월 19일까지 볼 수 있어요",
    },
  },
} as const;

/**
 * `/download` 페이지 카피. `comingSoon`은 임시 문구 — 확정 전 사람 확인 필요
 * (`docs/plans/0002-os-download-qr.md`).
 */
export const DOWNLOAD_COPY = {
  comingSoon: "헤디는 출시 준비 중이에요",
} as const;
