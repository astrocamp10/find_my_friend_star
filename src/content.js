export const content = {
  app: {
    name: "나의 친구 별 찾기",
    tagline: "내 정보로 하늘에서 하나의 별을 찾아 보고, 과학으로 읽고 이야기로 기억해요.",
    audience: "초등 고학년부터 중고등학생까지 혼자 읽어도 이해하기 쉬운 톤",
    tone: ["다정한", "명확한", "과학과 상징을 구분하는", "개인정보를 안심시키는"],
  },

  navigation: {
    start: "친구 별 찾기",
    science: "과학 정보",
    meaning: "상징 매칭",
    privacy: "개인정보 안내",
    retry: "다시 찾기",
  },

  hero: {
    eyebrow: "학생용 별 탐험",
    title: "오늘 밤, 나와 닮은 친구 별을 찾아볼까요?",
    body: "이름이나 생일을 입력하면 공개 별 데이터에서 조건에 맞는 별을 골라 보여줘요. 별의 실제 정보는 과학으로, 별과 나를 연결하는 말은 상징으로 따로 안내해요.",
    primaryCta: "내 친구 별 찾기",
    secondaryCta: "어떻게 찾는지 보기",
  },

  privacyNotice: {
    short: "이름과 생일은 저장하지 않아요.",
    body: "입력한 이름과 생일은 친구 별을 찾는 순간에만 사용해요. 서버에 저장하거나 다른 사람에게 보여주지 않고, 결과를 다시 만들 때도 새로 입력해야 해요.",
    formHint: "개인정보가 걱정된다면 별명이나 이니셜을 써도 괜찮아요.",
    resultHint: "공유할 때는 이름 대신 별명으로 바꿔도 좋아요.",
  },

  form: {
    title: "별에게 전할 작은 단서",
    description: "정확한 개인정보보다, 내가 기억하기 좋은 단서를 넣는 것이 더 중요해요.",
    fields: {
      name: {
        label: "이름 또는 별명",
        placeholder: "예: 하늘, 민준, J",
        helper: "실명을 쓰지 않아도 돼요. 결과 카드에 표시될 이름이에요.",
      },
      birthDate: {
        label: "생일",
        placeholder: "예: 2012-04-18",
        helper: "별을 고르는 기준에만 사용하고 저장하지 않아요.",
      },
    },
    consent: {
      label: "입력값이 저장되지 않는다는 안내를 확인했어요.",
      helper: "확인해야 친구 별 찾기를 시작할 수 있어요.",
    },
    submit: "별 지도 열기",
  },

  loading: {
    title: "하늘 지도를 살펴보는 중이에요",
    steps: [
      "공개 별 데이터에서 후보 별을 찾고 있어요.",
      "밝기, 색, 위치 같은 과학 정보를 정리하고 있어요.",
      "과학 정보와 상징 문장을 따로 나누어 카드에 담고 있어요.",
    ],
    patience: "별빛은 오래 여행해 오니까, 우리도 잠깐만 기다려요.",
  },

  result: {
    titleTemplate: "{name}의 친구 별",
    subtitle: "이 별은 실제 관측 데이터로 설명하고, 상징 매칭은 이야기로 즐겨요.",
    badges: {
      fact: "과학 정보",
      symbolic: "상징 매칭",
      privacy: "저장 안 함",
    },
    actions: {
      copy: "결과 문구 복사",
      saveImage: "카드 이미지 저장",
      findAgain: "다른 별 찾기",
      openScience: "과학 설명 보기",
    },
  },

  sciencePanel: {
    title: "이 부분은 과학 정보예요",
    intro: "아래 내용은 별 데이터와 계산으로 설명할 수 있는 정보예요.",
    items: {
      catalogId: {
        label: "별 데이터 번호",
        empty: "데이터 번호를 불러오지 못했어요.",
      },
      coordinates: {
        label: "하늘에서의 위치",
        helper: "별의 위치는 천문학에서 쓰는 좌표로 나타낼 수 있어요.",
      },
      brightness: {
        label: "밝기",
        helper: "숫자가 작을수록 더 밝게 보이는 방식의 밝기 정보가 쓰일 수 있어요.",
      },
      color: {
        label: "색의 힌트",
        helper: "별의 색은 온도와 관련이 있어요. 푸른빛 별은 대체로 더 뜨겁고, 붉은빛 별은 대체로 더 차가워요.",
      },
      distance: {
        label: "거리",
        helper: "별까지의 거리는 관측값과 계산 방법에 따라 오차가 있을 수 있어요.",
      },
    },
    disclaimer: "과학 정보는 공개 별 데이터와 계산 기준에 따라 달라질 수 있어요. 이 앱은 학습과 탐험을 돕기 위한 안내로 사용해 주세요.",
  },

  symbolicPanel: {
    title: "이 부분은 상징 매칭이에요",
    intro: "아래 문장은 과학적 증명이 아니라, 별의 특징을 빌려 나를 표현해 보는 이야기예요.",
    examples: [
      {
        trait: "밝게 보이는 별",
        message: "주변을 환하게 만드는 힘을 떠올리게 해요.",
      },
      {
        trait: "붉은빛이 도는 별",
        message: "천천히 오래 빛나는 따뜻함을 상징해요.",
      },
      {
        trait: "푸른빛이 도는 별",
        message: "호기심과 새로운 생각을 상징해요.",
      },
    ],
    disclaimer: "상징 매칭은 재미와 자기표현을 위한 문장입니다. 별이 성격이나 미래를 결정한다는 뜻은 아니에요.",
  },

  starCard: {
    labels: {
      nickname: "친구 별 이름",
      oneLineMeaning: "한 줄 상징",
      observationNote: "관찰 노트",
      question: "생각해 볼 질문",
    },
    defaultCopy: {
      nickname: "{name}의 작은 등대별",
      oneLineMeaning: "멀리 있어도 방향을 알려주는 빛",
      observationNote: "이 별의 실제 정보는 과학 카드에서 확인할 수 있어요. 이 문장은 별을 기억하기 쉽게 만든 상징 문장이에요.",
      question: "내가 누군가에게 방향을 알려준 순간은 언제였나요?",
    },
  },

  educationalCopy: {
    title: "알고 보면 더 재미있는 별 이야기",
    cards: [
      {
        title: "별빛은 시간을 건너와요",
        body: "멀리 있는 별일수록 그 빛이 우리 눈에 도착하기까지 더 오래 걸려요. 그래서 별을 본다는 건 우주의 과거를 보는 일이기도 해요.",
      },
      {
        title: "밝기와 거리는 다르게 생각해요",
        body: "가까운 별은 실제로는 덜 밝아도 밝게 보일 수 있고, 아주 밝은 별도 멀리 있으면 희미하게 보일 수 있어요.",
      },
      {
        title: "색은 온도의 힌트가 돼요",
        body: "별의 색은 표면 온도와 관련이 있어요. 과학 정보와 감성 문장을 구분해서 읽으면 더 정확하고 재미있어요.",
      },
    ],
  },

  emptyStates: {
    noInput: "친구 별을 찾으려면 이름 또는 별명과 생일을 입력해 주세요.",
    noResult: "조건에 맞는 별을 찾지 못했어요. 날짜를 다시 확인하거나 조금 뒤에 다시 시도해 주세요.",
    noNetwork: "별 데이터를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
  },

  errors: {
    nameRequired: "결과 카드에 쓸 이름이나 별명을 입력해 주세요.",
    birthDateRequired: "생일을 입력해야 별을 고를 수 있어요.",
    invalidBirthDate: "생일 형식이 맞는지 확인해 주세요. 예: 2012-04-18",
    consentRequired: "개인정보 저장 안 함 안내를 확인해 주세요.",
    unknown: "예상하지 못한 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  },

  accessibility: {
    formRegion: "친구 별 찾기 입력 영역",
    resultRegion: "친구 별 결과 영역",
    scienceRegion: "과학 정보 설명 영역",
    symbolicRegion: "상징 매칭 설명 영역",
    loadingStatus: "별 데이터를 불러오는 중",
  },
};

export default content;
