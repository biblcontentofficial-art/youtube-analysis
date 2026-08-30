/**
 * /incubating — 브랜드 인큐베이팅 (영어·수학)
 * 외부 선생님 모집용 공개 페이지. 네이버 카페의 "[분야:영어] 인큐베이팅"
 * 공지 제안서를 영어·수학 두 분야로 확장했다.
 * 네비 "브랜드 인큐베이팅"과 커뮤니티 탭에서 진입한다 (비회원도 열람 가능).
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "브랜드 인큐베이팅 | 비블랩 (bibl lab)",
  description:
    "영어·수학 선생님을 위한 비블 브랜드 인큐베이팅. 채널 기획·제작·마케팅·상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.",
};

const ACCENT = "text-[#00E5A0]";

/** 학원 선생님 vs 유튜브 비즈니스 모델 비교 */
const MODEL_ROWS: { before: string; after: string }[] = [
  {
    before: "시간을 팔고 끝난다",
    after: "일 하지 않을 때도, 잘 때도 콘텐츠가 판매되어 매출이 쌓인다",
  },
  { before: "강의가 끝나면 관계도 끝", after: "구독자는 계속 남아 다음 상품을 산다" },
  { before: "다른 학원으로 옮기면 0부터", after: "브랜딩과 팬덤이 쌓여간다" },
  {
    before: "수입이 시간에 묶임",
    after: "콘텐츠 한 편이 시간 관계없이 계속해서 수익을 만든다",
  },
];

/** 손익 5:5 배분 예시 (월 기준) */
const PROFIT_ROWS: { label: string; value: string; strong?: boolean }[] = [
  { label: "매출 (강의 + 광고 + 협찬 등)", value: "3,000만 원" },
  { label: "직접비용 (제작비·편집비 등 계약서에 합의된 항목만)", value: "-400만 원" },
  { label: "손익", value: "2,600만 원" },
  { label: "선생님 몫 (50%)", value: "1,300만 원", strong: true },
  { label: "레이블 몫 (50%)", value: "1,300만 원" },
];

/** 비용 선부담 항목 */
const COST_ROWS: { item: string; payer: string }[] = [
  { item: "영상 제작비", payer: "레이블 선부담" },
  { item: "강의 광고비 (퍼포먼스 마케팅)", payer: "레이블 선부담" },
  { item: "썸네일·디자인", payer: "레이블 부담" },
  { item: "강의 서비스 구축 및 서버비", payer: "레이블 부담" },
];

/** 레이블이 하는 일 vs 선생님이 하는 일 */
const ROLE_ROWS: { stage: string; label: string; teacher: string }[] = [
  { stage: "채널 설계", label: "포지셔닝·콘텐츠 구성·첫 라인업 기획", teacher: "강점 인풋, 컨셉 합의" },
  { stage: "콘텐츠 제작", label: "기획·촬영·편집·썸네일·업로드·성과 트래킹", teacher: "출연·대본" },
  { stage: "채널 성장", label: "지표 분석·병목 진단·개선안", teacher: "실행" },
  { stage: "강의 상품화", label: "강의촬영·편집·상세페이지 제작", teacher: "커리큘럼 설계 및 수업 제작·출연" },
  { stage: "런칭", label: "사전알림 → 얼리버드 → 본판매 퍼널·광고·랜딩", teacher: "홍보 및 출연" },
  { stage: "정산", label: "수익 집계·명세서 자동 발행·지급", teacher: "명세 확인" },
];

/** 5가지 심사 기준 */
const CRITERIA: { name: string; desc: string }[] = [
  { name: "전문성", desc: "가르치는 내용에 진짜 깊이가 있는가" },
  { name: "전달력", desc: "카메라 앞에서 메시지가 살아나는가" },
  { name: "차별성", desc: "같은 분야의 다른 채널과 구분되는 각이 있는가" },
  { name: "지속가능성", desc: "최소 1년 이상 꾸준히 갈 분인가" },
  { name: "상품화 잠재력", desc: "이 전문성이 강의 상품으로 이어질 수 있는가" },
];

/** 섹션 제목 */
function SectionTitle({ no, children }: { no: string; children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold tracking-tight text-white lg:text-xl">
      <span className={`mr-2 tabular-nums ${ACCENT}`}>{no}</span>
      {children}
    </h3>
  );
}

/** 인용 문단 */
function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-sm leading-relaxed text-neutral-200">
      {children}
    </blockquote>
  );
}

export default function IncubatingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <div className="space-y-10">
      {/* 히어로 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#00E5A0]/40 bg-[#00E5A0]/10 px-3 py-1 text-xs font-bold text-[#00E5A0]">
            모집 분야 · 영어
          </span>
          <span className="rounded-full border border-[#00E5A0]/40 bg-[#00E5A0]/10 px-3 py-1 text-xs font-bold text-[#00E5A0]">
            모집 분야 · 수학
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white lg:text-3xl">
          유튜브 브랜드 인큐베이팅 지원하세요
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-300 lg:text-base">
          영어·수학 교육 쪽에 일하고 계시면서 비블과 함께할 분을 찾고 있습니다.
          비블이 채널 기획·제작·마케팅·상품화를 맡고, 선생님은 가르치는 일에만
          집중하는 콘텐츠 비즈니스 제안서입니다.
        </p>
      </section>

      {/* 1. 프로젝트 소개 */}
      <section className="space-y-4">
        <SectionTitle no="1.">비블과 함께 하는 유튜브 &amp; 비즈니스 프로젝트</SectionTitle>
        <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
          <p>
            실력은 검증됐는데, <strong className="text-white">강의료가 시간에 묶여 있어</strong> 수입의
            천장이 보이는 분
          </p>
          <p>
            유튜브·콘텐츠가 답이라는 건 알지만,{" "}
            <strong className="text-white">기획·편집·썸네일·마케팅까지 혼자 감당할 수 없어</strong> 시작을
            미뤄온 분
          </p>
          <p>
            내 이름으로 된 <strong className="text-white">브랜드와 자산을 쌓고 싶은데</strong>, 그 길을 함께
            설계하고 제작해줄 파트너가 필요한 분
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-sm leading-relaxed text-neutral-300">
          <p className="font-semibold text-white">반대로, 이 제안은 이런 분께는 맞지 않습니다.</p>
          <p className="mt-2">콘텐츠 없이 빠른 부수입만 원하시는 분</p>
          <p>전문성·꾸준함보다 단발성 화제성에 기대고 싶은 분</p>
          <p className="mt-3 text-neutral-400">
            저희는 모든 분들과 함께하지는 않습니다. 오랫동안 함께할 파트너 분을 찾고 있습니다.
          </p>
        </div>
      </section>

      {/* 2. 실적 */}
      <section className="space-y-4">
        <SectionTitle no="2.">비블 : 검증된 교육 콘텐츠 사업가</SectionTitle>
        <p className="text-sm leading-relaxed text-neutral-200">
          교육 콘텐츠로 성공을 만드는 일은 의지나 열정의 문제가 아니라,{" "}
          <strong className="text-white">공식을 가진 사람이 있느냐</strong>의 문제입니다. 저희는 그 공식을
          이미 가지고 있습니다.
        </p>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">
            2-1. 직접 운영·기획하는 채널들 (총 구독자 <span className={ACCENT}>70만</span>)
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm font-bold text-white">
                세계유명골프정보 <span className={ACCENT}>26만</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                골프 채널 운영 및 골프 쇼핑몰 운영
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm font-bold text-white">
                영어 키위새 <span className={ACCENT}>25만</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                영어 교육 카테고리의 성공공식. 직접 운영·기획.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm font-bold text-white">
                스윔클래스 <span className={ACCENT}>8.5만</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">수영 교육 채널</p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm font-bold text-white">
                비블(bibl) <span className={ACCENT}>4.3만</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                1인 사업가를 위한 콘텐츠 비즈니스 채널
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-300">
            이외 다른 채널들까지 합치면 총 구독자는 <strong className="text-white">70만 명</strong>입니다.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white">2-2. 교육 유튜버 다수 컨설팅 실적</h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            자체 채널뿐 아니라, <strong className="text-white">구독자 11만, 5만 규모의 영어 유튜버를 포함한
            다수의 교육 채널을 컨설팅</strong>하며 성장 공식을 검증해 왔습니다. 선생님 브랜딩과 콘텐츠
            비즈니스 설계는 저희의 본업입니다.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white">2-3. 그래서 무엇이 다른가</h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            대부분의 &ldquo;유튜브 같이 하자&rdquo;는 제안은{" "}
            <strong className="text-white">공식 없이 선생님의 열정에만 기댑니다.</strong> 저희는 반대입니다.
            유튜브 채널 운영, 기획, 촬영, 편집, 채널 포지셔닝, 콘텐츠 구성, 강의 상품화, 런칭 퍼널까지{" "}
            <strong className="text-white">이미 여러 번 검증해온 시스템</strong>으로 선생님의 전문성을
            결과로 바꿉니다.
          </p>
        </div>
      </section>

      {/* 3. 남는 것 */}
      <section className="space-y-4">
        <SectionTitle no="3.">함께하면 무엇이 남는가</SectionTitle>
        <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
          <p>이 제안에서 가장 중요한 한 가지입니다. 선생님께서는 자산이 남습니다.</p>
          <p>
            유튜브를 통해 치열한 경쟁시장인 교육 시장에서 가장 확실한 내 이름을 남기는 비즈니스를
            만들어갑니다.
          </p>
          <p className="font-bold text-white">구조는 이렇습니다. 투자는 레이블이, 브랜드는 선생님이</p>
          <p>
            함께 만드는 채널은 레이블이 소유하고, 제작비·광고비·운영 리스크 전부를 레이블이 책임집니다.
          </p>
          <p>
            채널에서 나오는 유튜브 수익, 강의·서비스 판매 수익의{" "}
            <strong className={ACCENT}>50%</strong>가 선생님의 몫입니다.
          </p>
        </div>

        {/* 비교 표 */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400">
                <th className="px-4 py-3 font-semibold">학원 선생님</th>
                <th className="px-4 py-3 font-semibold text-white">
                  유튜브 채널·콘텐츠 온라인 비즈니스 모델
                </th>
              </tr>
            </thead>
            <tbody>
              {MODEL_ROWS.map((row) => (
                <tr key={row.before} className="border-b border-neutral-800 last:border-b-0">
                  <td className="px-4 py-3 text-neutral-400">{row.before}</td>
                  <td className="px-4 py-3 text-neutral-100">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
          <p className="font-bold text-white">독립까지 설계되어 있습니다</p>
          <p>
            함께 성장하다 보면 언젠가 독립을 원하실 수 있습니다. 저희는 그 가능성을 숨기지 않고,{" "}
            <strong className="text-white">처음부터 계약서에 독립하실 수 있는 출구를 설계해 두었습니다.</strong>{" "}
            독립 시점에 채널의 가치를 <strong className="text-white">계약 때 미리 합의한 기준으로 산정</strong>하고,
            선생님께 그 채널을 <strong className="text-white">인수하실 수 있는 우선권</strong>을 드립니다.
          </p>
          <p>
            막연히 &ldquo;나중에 잘 해드리겠다&rdquo;가 아니라, 시작할 때 헤어지는 방법까지 문서로 약속하는
            것, 이것이 저희가 드리는 가장 정직한 약속입니다. 저희는 선생님을 묶어두는 것으로 돈을 벌지
            않고, <strong className="text-white">선생님이 커지면 저희도 커지는 구조</strong>로 돈을 법니다.
          </p>
        </div>
      </section>

      {/* 4. 수익 구조 */}
      <section className="space-y-4">
        <SectionTitle no="4.">수익 구조 : 시간당 강의료에서 자산형 수익으로</SectionTitle>
        <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
          <p>기존 모델은 단일 수익(강의료)입니다.</p>
          <p>
            저희가 만드는 건 <strong className="text-white">다층 수익 구조</strong>입니다: 강의 + 유튜브 광고
            + 협찬 + 전자책. 그리고 이 수익을 나누는 원칙은 단 하나입니다.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">4-1. 배분 원칙 : 손익을 5:5로 나눕니다</h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            모든 수익(강의·광고·협찬·전자책 등)은{" "}
            <strong className="text-white">
              매출에서 합의된 직접비용(기획·촬영·편집·광고비 등)을 제외한 손익을 레이블과 선생님이 5:5로
              배분
            </strong>
            합니다.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400">
                  <th className="px-4 py-3 font-semibold">구분</th>
                  <th className="px-4 py-3 font-semibold">예시 (월 기준)</th>
                </tr>
              </thead>
              <tbody>
                {PROFIT_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-neutral-800 last:border-b-0">
                    <td className={`px-4 py-3 ${row.strong ? "font-bold text-white" : "text-neutral-300"}`}>
                      {row.label}
                    </td>
                    <td
                      className={`px-4 py-3 tabular-nums ${
                        row.strong ? `font-bold ${ACCENT}` : "text-neutral-100"
                      }`}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1.5 text-sm leading-relaxed text-neutral-300">
            <p className="text-white">왜 이 구조인가:</p>
            <p>
              <strong className="text-white">단순하고 투명합니다.</strong> 수익원마다 다른 계산식이 아니라,
              하나의 원칙으로 모든 정산이 설명됩니다.
            </p>
            <p>
              <strong className="text-white">같은 배를 탑니다.</strong> 이익을 똑같이 나누기 때문에, 저희는
              불필요한 비용을 쓸 이유가 없고 선생님의 이익을 키우는 것이 곧 저희의 이익입니다.
            </p>
            <p>
              <strong className="text-white">임의 차감이 없습니다.</strong> 비용 항목과 상한은 계약서에 미리
              합의하며, 선생님은 언제든 내역을 열람하실 수 있습니다.
            </p>
          </div>
          <Quote>
            원칙: <strong className="text-white">이익이 나면 정확히 절반씩.</strong> 선생님이 벌면 저희도
            같이 버는 구조입니다. 이것이 저희가 선생님의 성공에 진심일 수밖에 없는 구조입니다.
          </Quote>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">4-2. 비용은 레이블이 먼저 냅니다</h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            선생님은 <strong className="text-white">초기 비용 부담 없이</strong> 시작하십니다.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[380px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400">
                  <th className="px-4 py-3 font-semibold">항목</th>
                  <th className="px-4 py-3 font-semibold">누가 먼저 내는가</th>
                </tr>
              </thead>
              <tbody>
                {COST_ROWS.map((row) => (
                  <tr key={row.item} className="border-b border-neutral-800 last:border-b-0">
                    <td className="px-4 py-3 text-neutral-300">{row.item}</td>
                    <td className="px-4 py-3 font-semibold text-white">{row.payer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            선부담한 직접비용은 손익 계산 시 매출에서 정산되며, 비용 항목·상한은 계약서에 미리 합의해 임의
            차감이 없도록 합니다.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white">4-3. 선생님이 더 가져가는 길도 열려 있습니다</h4>
          <p className="text-sm leading-relaxed text-neutral-200">
            배분은 고정이 아닙니다.{" "}
            <strong className="text-white">
              채널과 상품이 안정 궤도에 오르면, 성과와 기여도에 따라 당연하게도 선생님 몫을 상향하는 조정
              구조를 협의할 수 있습니다.
            </strong>
          </p>
          <Quote>
            위 비율은 <strong className="text-white">설계 기준선</strong>이며,{" "}
            <strong className="text-white">세부 조건은 미팅 후 계약서로 확정</strong>합니다. 협상 여지가 없는
            고정값이 아닙니다.
          </Quote>
        </div>
      </section>

      {/* 5. 역할 분담 */}
      <section className="space-y-4">
        <SectionTitle no="5.">레이블이 하는 일 vs 선생님이 하는 일</SectionTitle>
        <p className="text-sm leading-relaxed text-neutral-200">
          선생님은 <strong className="text-white">콘텐츠와 전문성에만 집중</strong>하십니다. 나머지는 저희
          시스템이 합니다.
        </p>
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400">
                <th className="px-4 py-3 font-semibold">단계</th>
                <th className="px-4 py-3 font-semibold">레이블이 하는 일</th>
                <th className="px-4 py-3 font-semibold">선생님이 하는 일</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_ROWS.map((row) => (
                <tr key={row.stage} className="border-b border-neutral-800 last:border-b-0">
                  <td className="px-4 py-3 font-semibold text-white">{row.stage}</td>
                  <td className="px-4 py-3 text-neutral-300">{row.label}</td>
                  <td className="px-4 py-3 text-neutral-100">{row.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Quote>
          한 문장으로: 선생님은 <strong className="text-white">&ldquo;가르치는 사람&rdquo;</strong>으로만
          계시면 됩니다. 기획·촬영·편집·썸네일·런칭·정산은 전부 저희가 합니다.
        </Quote>
      </section>

      {/* 6. 심사 */}
      <section className="space-y-4">
        <SectionTitle no="6.">함께할 선생님의 조건 : 아무나 받지 않습니다</SectionTitle>
        <p className="text-sm leading-relaxed text-neutral-200">
          저희는 아무에게나 제안을 드리는 것이 아닙니다.{" "}
          <strong className="text-white">저희도 선생님을 고릅니다.</strong> 이유는 단순합니다. 저희는 선생님
          한 분 한 분 브랜딩, 유튜브 채널 기획, 촬영, 편집비, 광고비, 랜딩페이지 설계 등 비용을{" "}
          <strong className="text-white">먼저</strong> 투입합니다. 검증되지 않은 분과 무분별하게 시작하면,
          저희도 선생님도 시간만 잃습니다. 그래서 저희는 모든 지원자를{" "}
          <strong className="text-white">5가지 심사</strong>로 평가합니다.
        </p>
        <ul className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          {CRITERIA.map((c) => (
            <li key={c.name} className="flex gap-3 text-sm">
              <span className="shrink-0 font-bold text-white">{c.name}</span>
              <span className="text-neutral-400">{c.desc}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-neutral-200">
          이 심사를 통과하신다는 것은, 저희가{" "}
          <strong className="text-white">
            &ldquo;이분과 함께라면 결과를 만들 수 있다&rdquo;고 판단했다는 신호
          </strong>
          입니다. 통과하신다면, 저희는 진심으로 선생님께 투자할 준비가 되어 있습니다.
        </p>
      </section>

      {/* 7. 다음 단계 */}
      <section className="space-y-4">
        <SectionTitle no="7.">다음 단계 : 현장 미팅</SectionTitle>
        <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
          <p>다음 단계는 간단합니다.</p>
          <p>
            <strong className="text-white">30분 온라인 미팅</strong> : 선생님의 강점·콘텐츠 방향을 듣고,
            저희가 어떤 채널·수익 구조를 그릴 수 있을지 구체적으로 말씀드립니다.
          </p>
          <p>
            <strong className="text-white">오프라인 미팅 5축 심사·핏 체크</strong> (수원 비블 TMK 스튜디오) :
            서로 함께할 수 있는지 양쪽이 판단합니다.
          </p>
          <p>
            <strong className="text-white">조건 협의 → 계약서 확정</strong> : 배분·기간·비용 등 세부 조건을
            미팅 내용에 맞춰 계약서로 확정합니다. 본 제안서의 배분 비율·정산 방식·계약 조건은 설계
            기준선이며, 세부 조건은 미팅 후 계약서로 최종 확정됩니다. 계약 체결 전 양측의 충분한 협의와
            검토를 거칩니다.
          </p>
        </div>
        <Quote>유튜브로 영향력과 매출을 올릴 준비가 되셨다면 함께 시작해보겠습니다.</Quote>
      </section>

      {/* 문의 CTA */}
      <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-lg font-bold tracking-tight text-white">
          교육 콘텐츠 브랜딩 &amp; 유튜브 프로젝트 문의하기
        </h3>
        <p className="text-sm leading-relaxed text-neutral-300">
          오픈채팅 또는 메일로 분야(영어·수학)와 선생님의 관련 커리어, 현재 운영하는 온라인 채널, 학원,
          선생님 소개를 함께 남겨주시면 빠른 시일 내로 연락드리겠습니다. 감사합니다.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="https://open.kakao.com/o/sM3RBKad"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            오픈채팅으로 지원하기
          </a>
          <a
            href="mailto:bibl.content.official@gmail.com"
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            bibl.content.official@gmail.com
          </a>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}
