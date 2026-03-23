// ─── 강의 데이터 정적 정의 ───────────────────────────────────────────────
// 강의 콘텐츠는 여기서 직접 관리합니다.
// 영상 URL: YouTube 비공개 링크 또는 Bunny CDN 임베드 URL 사용

export interface Lesson {
  id: string;
  title: string;
  duration: string; // "12:34" 형식
  videoUrl: string; // YouTube embed URL or Bunny CDN
  isFree: boolean;  // 무료 미리보기 여부
  description?: string;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  instructor: string;
  instructorBio: string;
  instructorImage: string;
  price: number;          // 0 = 가격문의
  priceLabel: string;     // 표시 가격 (예: "297,000원" 또는 "가격문의")
  originalPrice?: number; // 할인 전 가격
  badge?: string;         // "BESTSELLER" | "NEW" | "모집중" 등
  category: "consulting" | "lecture" | "agency";
  level: "입문" | "초급" | "중급" | "고급";
  totalLessons: number;
  totalDuration: string;
  enrollCount: number;
  rating: number;
  published: boolean;
  tags: string[];
  features: string[];     // 강의 포함 내용 목록
  curriculum: Section[];
}

// ─── 강사 정보 ────────────────────────────────────────────────────────────
export const INSTRUCTOR = {
  name: "비블 (김태민)",
  bio: "총 70만 구독자 채널 운영자 · TMK STUDIO 대표\n세계유명 골프정보(24만), 영어키위새(22만), 스윔클래스(8만), 비블(3.5만) 등 다양한 분야 채널을 직접 운영하며 수억 원의 매출을 만든 실전 전문가",
  image: "/studio/instructor.jpg",
  youtube: "https://www.youtube.com/@bibl",
  stats: [
    { label: "총 구독자", value: "70만+" },
    { label: "누적 조회", value: "1억회+" },
    { label: "운영 채널", value: "4개+" },
    { label: "수강생", value: "500명+" },
  ],
};

// ─── 강의 목록 ────────────────────────────────────────────────────────────
export const COURSES: Course[] = [
  {
    slug: "1on1-consulting",
    title: "1:1 유튜브 컨설팅",
    subtitle: "비블과 4회에 걸친 집중 1:1 맞춤 컨설팅",
    description:
      "내 채널의 문제를 정확히 진단하고, 실질적인 성장 전략을 함께 설계합니다. " +
      "썸네일·제목·알고리즘·수익화까지 비블이 직접 현재 채널을 분석하고 즉시 적용 가능한 솔루션을 제공합니다.",
    thumbnail: "/studio/consulting-thumb.jpg",
    instructor: "비블 (김태민)",
    instructorBio: INSTRUCTOR.bio,
    instructorImage: INSTRUCTOR.image,
    price: 0,
    priceLabel: "가격문의",
    badge: "모집중 (6기)",
    category: "consulting",
    level: "입문",
    totalLessons: 4,
    totalDuration: "4회 세션",
    enrollCount: 87,
    rating: 4.9,
    published: true,
    tags: ["1:1 컨설팅", "채널 분석", "썸네일", "알고리즘", "수익화"],
    features: [
      "채널 현황 전체 진단 (1회차)",
      "콘텐츠 전략 설계 (2회차)",
      "썸네일·제목 A/B 개선 실습 (3회차)",
      "수익화·비즈니스 연계 전략 (4회차)",
      "세션 녹화본 제공",
      "30일 카카오톡 질문 지원",
    ],
    curriculum: [
      {
        id: "session-1",
        title: "1회차 — 채널 전체 진단",
        lessons: [
          { id: "s1-l1", title: "채널 현황 점검 및 데이터 분석", duration: "60:00", videoUrl: "", isFree: false },
          { id: "s1-l2", title: "경쟁 채널 비교 분석", duration: "30:00", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "session-2",
        title: "2회차 — 콘텐츠 전략 설계",
        lessons: [
          { id: "s2-l1", title: "타겟 시청자 설정", duration: "40:00", videoUrl: "", isFree: false },
          { id: "s2-l2", title: "콘텐츠 캘린더 작성", duration: "50:00", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "session-3",
        title: "3회차 — 썸네일·제목 최적화",
        lessons: [
          { id: "s3-l1", title: "클릭률 높이는 썸네일 원칙", duration: "45:00", videoUrl: "", isFree: false },
          { id: "s3-l2", title: "제목 A/B 테스트 방법", duration: "35:00", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "session-4",
        title: "4회차 — 수익화 & 비즈니스 연계",
        lessons: [
          { id: "s4-l1", title: "유튜브 수익화 로드맵", duration: "50:00", videoUrl: "", isFree: false },
          { id: "s4-l2", title: "비즈니스 전환 전략", duration: "40:00", videoUrl: "", isFree: false },
        ],
      },
    ],
  },
  {
    slug: "youtube-business-blackmap",
    title: "유튜브 비즈니스 블랙맵",
    subtitle: "8주 완성 — 수익화까지 가는 체계적 로드맵",
    description:
      "단순한 유튜브 운영 강의가 아닙니다. 브랜딩, 콘텐츠 기획, 원고 작성, 썸네일, 알고리즘, " +
      "비즈니스 전환까지 8주 안에 완성하는 실전 로드맵입니다. " +
      "비블이 직접 수억 원 매출을 만든 방법 그대로 배웁니다.",
    thumbnail: "/studio/blackmap-thumb.jpg",
    instructor: "비블 (김태민)",
    instructorBio: INSTRUCTOR.bio,
    instructorImage: INSTRUCTOR.image,
    price: 297000,
    priceLabel: "297,000원",
    originalPrice: 490000,
    badge: "BESTSELLER",
    category: "lecture",
    level: "초급",
    totalLessons: 32,
    totalDuration: "8주 · 약 24시간",
    enrollCount: 342,
    rating: 4.8,
    published: true,
    tags: ["8주 과정", "비즈니스", "수익화", "콘텐츠 기획", "알고리즘"],
    features: [
      "32개 강의 영상 (평균 45분)",
      "주차별 과제 + 피드백",
      "수강생 전용 커뮤니티",
      "강의 자료 PDF 제공",
      "1년 무제한 재수강",
      "수료증 발급",
    ],
    curriculum: [
      {
        id: "week-1",
        title: "1주차 — 브랜드 정체성 기획",
        lessons: [
          { id: "w1-l1", title: "나만의 유튜브 포지셔닝 설계", duration: "38:24", videoUrl: "", isFree: true, description: "채널의 핵심 가치와 타겟 시청자를 정의합니다." },
          { id: "w1-l2", title: "경쟁 채널 분석 실습", duration: "42:10", videoUrl: "", isFree: true },
          { id: "w1-l3", title: "채널 아이덴티티 시각화", duration: "31:05", videoUrl: "", isFree: false },
          { id: "w1-l4", title: "1주차 과제 해설", duration: "22:33", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-2",
        title: "2주차 — 콘텐츠 기획",
        lessons: [
          { id: "w2-l1", title: "조회수 나오는 콘텐츠 순서의 비밀", duration: "51:17", videoUrl: "", isFree: false },
          { id: "w2-l2", title: "키워드 리서치 실전 방법", duration: "44:38", videoUrl: "", isFree: false },
          { id: "w2-l3", title: "영상 아이디어 100개 뽑기", duration: "35:22", videoUrl: "", isFree: false },
          { id: "w2-l4", title: "콘텐츠 캘린더 만들기", duration: "28:44", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-3",
        title: "3주차 — 원고 작성",
        lessons: [
          { id: "w3-l1", title: "좋은 원고의 4가지 조건 (공감·정보·재미·신뢰)", duration: "48:55", videoUrl: "", isFree: false },
          { id: "w3-l2", title: "도입부 3초 훅 작성법", duration: "39:12", videoUrl: "", isFree: false },
          { id: "w3-l3", title: "시청 지속률 높이는 구성", duration: "43:28", videoUrl: "", isFree: false },
          { id: "w3-l4", title: "원고 템플릿 실습", duration: "33:07", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-4",
        title: "4주차 — 촬영 & 편집",
        lessons: [
          { id: "w4-l1", title: "카메라 없이 시작하는 방법", duration: "36:44", videoUrl: "", isFree: false },
          { id: "w4-l2", title: "프리미어 프로 기초 편집", duration: "55:30", videoUrl: "", isFree: false },
          { id: "w4-l3", title: "자막·효과음 활용", duration: "29:18", videoUrl: "", isFree: false },
          { id: "w4-l4", title: "편집 시간 반으로 줄이기", duration: "24:52", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-5",
        title: "5주차 — 썸네일 & 제목",
        lessons: [
          { id: "w5-l1", title: "클릭률 30% 올리는 썸네일 공식", duration: "46:33", videoUrl: "", isFree: false },
          { id: "w5-l2", title: "포토샵 없이 썸네일 만들기", duration: "38:15", videoUrl: "", isFree: false },
          { id: "w5-l3", title: "제목 A/B 테스트 방법론", duration: "31:42", videoUrl: "", isFree: false },
          { id: "w5-l4", title: "설명란·태그 SEO 최적화", duration: "27:09", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-6",
        title: "6주차 — 알고리즘 & 업로드",
        lessons: [
          { id: "w6-l1", title: "유튜브 알고리즘 작동 원리", duration: "52:11", videoUrl: "", isFree: false },
          { id: "w6-l2", title: "최적 업로드 시간 전략", duration: "22:47", videoUrl: "", isFree: false },
          { id: "w6-l3", title: "초반 조회수 부스팅 전략", duration: "34:28", videoUrl: "", isFree: false },
          { id: "w6-l4", title: "커뮤니티·쇼츠 연계", duration: "28:33", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-7",
        title: "7주차 — 데이터 분석",
        lessons: [
          { id: "w7-l1", title: "유튜브 스튜디오 핵심 지표 읽기", duration: "44:19", videoUrl: "", isFree: false },
          { id: "w7-l2", title: "이탈 지점 개선하기", duration: "37:54", videoUrl: "", isFree: false },
          { id: "w7-l3", title: "채널 성장 KPI 설정", duration: "29:06", videoUrl: "", isFree: false },
          { id: "w7-l4", title: "경쟁 채널 벤치마킹", duration: "32:41", videoUrl: "", isFree: false },
        ],
      },
      {
        id: "week-8",
        title: "8주차 — 수익화 & 비즈니스",
        lessons: [
          { id: "w8-l1", title: "수익화 4가지 루트 전략", duration: "49:27", videoUrl: "", isFree: false },
          { id: "w8-l2", title: "브랜드 협찬 협상법", duration: "38:13", videoUrl: "", isFree: false },
          { id: "w8-l3", title: "오프라인 비즈니스 연계 성공 사례", duration: "41:55", videoUrl: "", isFree: false },
          { id: "w8-l4", title: "수료 후 성장 로드맵", duration: "26:08", videoUrl: "", isFree: false },
        ],
      },
    ],
  },
  {
    slug: "team-bibl",
    title: "유튜브 팀비블",
    subtitle: "비블과 함께하는 10개월 유튜브 성장 여정",
    description:
      "혼자 유튜브를 운영하며 막히는 순간, 팀비블이 함께합니다. " +
      "월 멤버십 구독 후 라이브 클래스, 피드백, 커뮤니티까지 — 비블이 직접 운영하는 실전 멤버십 프로그램입니다.",
    thumbnail: "/studio/team-bibl/01.png",
    instructor: "비블 (김태민)",
    instructorBio: INSTRUCTOR.bio,
    instructorImage: INSTRUCTOR.image,
    price: 0,
    priceLabel: "월 멤버십",
    badge: "모집중 · 3자리",
    category: "lecture",
    level: "입문",
    totalLessons: 0,
    totalDuration: "10개월 과정",
    enrollCount: 0,
    rating: 5.0,
    published: true,
    tags: ["라이브 클래스", "월 멤버십", "팀비블", "10개월"],
    features: [
      "비블 라이브 클래스 무료 수강",
      "월 멤버십 구독자 전용 혜택",
      "쿠폰으로 강의 0원 수강",
      "10개월 유튜브 성장 여정",
      "카카오톡 문의 지원",
    ],
    curriculum: [],
  },
  {
    slug: "channel-agency",
    title: "유튜브 채널 대행",
    subtitle: "TMK STUDIO가 채널 전체를 운영합니다",
    description:
      "브랜드 기획부터 촬영·편집·업로드·분석·비즈니스 연계까지 8단계 전 과정을 TMK STUDIO가 직접 진행합니다. " +
      "검증된 채널 운영 경험 그대로 여러분의 채널에 적용합니다.",
    thumbnail: "/studio/agency-thumb.jpg",
    instructor: "비블 (김태민)",
    instructorBio: INSTRUCTOR.bio,
    instructorImage: INSTRUCTOR.image,
    price: 0,
    priceLabel: "가격문의",
    badge: "맞춤형",
    category: "agency",
    level: "입문",
    totalLessons: 0,
    totalDuration: "계약 기간에 따라",
    enrollCount: 23,
    rating: 5.0,
    published: true,
    tags: ["채널 대행", "풀매니지먼트", "촬영·편집", "비즈니스 연계"],
    features: [
      "브랜드 정체성 기획",
      "콘텐츠 기획 & 대본 작성",
      "촬영 & 편집 전 과정",
      "업로드 & SEO 최적화",
      "데이터 분석 & 월간 리포트",
      "비즈니스 성과 연계 컨설팅",
      "1:1 비블 직접 컨설팅",
    ],
    curriculum: [],
  },
];

// ─── 헬퍼 함수 ───────────────────────────────────────────────────────────
export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getPublishedCourses(): Course[] {
  return COURSES.filter((c) => c.published);
}

/** Clerk publicMetadata.purchased_courses 배열과 비교 */
export function hasPurchased(
  purchasedCourses: string[] | undefined,
  courseSlug: string
): boolean {
  if (!purchasedCourses) return false;
  return purchasedCourses.includes(courseSlug);
}

export function getTotalLessons(course: Course): number {
  return course.curriculum.reduce((sum, s) => sum + s.lessons.length, 0);
}

export function getFreeLessons(course: Course): Lesson[] {
  return course.curriculum.flatMap((s) => s.lessons.filter((l) => l.isFree));
}

/** 강의 진행률 계산용 (완료한 lessonId 배열 기반) */
export function calcProgress(
  course: Course,
  completedIds: string[]
): { completed: number; total: number; percent: number } {
  const total = getTotalLessons(course);
  const completed = completedIds.filter((id) =>
    course.curriculum.some((s) => s.lessons.some((l) => l.id === id))
  ).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
