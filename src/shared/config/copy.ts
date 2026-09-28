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
      body: [
        "펌·컬러·시술 사진을 한 곳에 기록하고,",
        "AI 분석과 AR 프리뷰로 다음 스타일을 미리 확인하세요.",
      ],
    },
    archive: {
      title: ["흩어진 기록이,", "한 화면으로"],
      body: [
        "갤러리, 메모, 카톡에 흩어져 있던 시술 기록을",
        "헤디 하나에 모았어요.",
      ],
    },
    record: {
      eyebrow: "01 — 시술기록 저장",
      title: ["한 번의 시술이,", "한 장의 기록으로"],
      body: [
        "사진 몇 장이면 기록이 끝납니다.",
        "스크롤을 내릴수록 기록이 시간순으로 쌓여요.",
      ],
    },
    report: {
      title: ["12번의 기록이,", "나를 설명합니다"],
      metrics: ["모발 손상도 낮음", "선호 톤 애쉬 계열", "시술 주기 평균 7주"],
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
    googlePlay: "Google Play",
    appStore: "App Store",
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
    recommend: {
      title: "추천 스타일",
      subtitle: "내 기록 기반",
      style: "애쉬브라운 레이어드 C컬",
      description: "톤은 유지하고, 컬만 다시",
      tags: ["손상도 낮음", "톤 유지", "펌 주기 도래"],
      basedOnRecords: [
        "2026.07 헤어 클리닉",
        "2026.03 애쉬브라운 리터치",
        "2025.09 레이어드 C컬펌",
      ],
      footnote: "세 개의 기록에서 나온 추천이에요",
    },
    ar: {
      scanning: "얼굴 인식 중",
      styles: ["내추럴 블랙", "애쉬 브라운", "다운펌 · 레이어드"],
    },
    qrShare: {
      title: "기록 공유",
      subtitle: "미용실에서 스캔하면 바로 열려요",
      delivered: "기록을 전달했어요",
      expiry: "링크는 24시간 동안 유효해요",
      sharedRecordsCount: "공유되는 기록 12건",
      latestTreatment: "최근 시술 뿌리 염색",
    },
    bScan: {
      prompt: "QR을 비추면 기록이 열려요",
    },
    bWebview: {
      url: "heddy.link/r/7Q2K",
      noAppNeeded: "앱 설치 없이 열림",
      ownerLabel: "헤디님의 시술 기록",
      recordCount: "12건",
      dateRange: "2025.03 – 2026.09",
      latestTreatment: "뿌리 염색 2026.09",
      productUsed: "사용 약제 6레벨 애쉬",
      developer: "산화제 3%",
      hairCondition: "모발 상태 손상도 낮음",
    },
  },
} as const;
