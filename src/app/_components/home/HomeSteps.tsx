/**
 * 홈 이용 방법 01·02·03(DESIGN 6.14 단계). 원형 배지 없이 실버 글자 숫자 + 위 가는 선. 누를 수 없어 hover 없음.
 * 문구는 옛 홈 '3단계로 바로 시작' 그대로.
 */
const STEPS = [
  { title: "키워드 입력", desc: "분석하고 싶은 유튜브 키워드를 검색창에 입력하세요." },
  { title: "실시간 분석", desc: "YouTube 최신 영상 데이터를 수집⁠·⁠분석합니다." },
  { title: "인사이트 확인", desc: "조회수와 채널 정보를 바탕으로 내 채널에 맞는 콘텐츠를 기획해보세요." },
];

export default function HomeSteps() {
  return (
    <>
      <h2 className="sr-only">3단계로 바로 시작</h2>
      <ol className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6 lg:mt-12">
        {STEPS.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[2.25rem_1fr] border-t border-line pt-5 sm:block">
            <span aria-hidden="true" className="tnum pt-0.5 text-body-sm font-bold text-silver sm:block sm:pt-0">
              {`0${i + 1}`}
            </span>
            <div>
              <h3 className="text-lead font-bold leading-[1.4] sm:mt-2">{step.title}</h3>
              <p className="mt-1 text-ui text-fg-3">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
