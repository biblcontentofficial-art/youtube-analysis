"use client";

function fmtNum(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

interface CompareData {
  keyword: string;
  youtube: {
    available: boolean;
    count: number;
    avgViews: number;
    maxViews: number;
  };
  threads: {
    available: boolean;
    connected: boolean;
    count: number;
    avgEngagement: number;
    avgViralScore: number;
    maxEngagement: number;
  };
}

interface Props {
  data: CompareData;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color ?? "text-white"}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CompareDashboard({ data }: Props) {
  const yt = data.youtube;
  const th = data.threads;

  // 인사이트 계산
  const insights: string[] = [];
  if (yt.available && th.available) {
    // 반응 비교 (유튜브 조회수 vs 스레드 반응 — 직접 비교 불가하므로 도달 기준)
    if (th.avgEngagement > 100 && yt.avgViews > 0) {
      const ratio = th.avgEngagement / (yt.avgViews / 100); // 스레드 반응 100당 유튜브 조회수
      if (ratio > 1.5) {
        insights.push(`이 키워드는 스레드에서 상대적으로 반응이 더 활발해요`);
      } else if (ratio < 0.5) {
        insights.push(`이 키워드는 유튜브에서 도달력이 훨씬 높아요`);
      } else {
        insights.push(`이 키워드는 유튜브와 스레드에서 비슷한 관심도를 보여요`);
      }
    }

    if (th.avgViralScore >= 50) {
      insights.push(`스레드 평균 바이럴 점수 ${th.avgViralScore}점 — 유튜브 영상을 스레드 글로 재가공하면 좋은 반응이 예상돼요`);
    }

    if (yt.count > 20 && th.count < 10) {
      insights.push(`유튜브엔 콘텐츠가 많지만 스레드엔 아직 적어요 — 스레드 선점 기회!`);
    } else if (th.count > 20 && yt.count < 10) {
      insights.push(`스레드에서 이미 화제인 주제예요 — 유튜브 영상으로 만들면 검색 유입이 기대돼요`);
    }
  }

  return (
    <div className="space-y-6">
      {/* 인사이트 */}
      {insights.length > 0 && (
        <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-semibold text-teal-400 mb-2">크로스플랫폼 인사이트</h3>
          {insights.map((text, i) => (
            <p key={i} className="text-sm text-gray-300">→ {text}</p>
          ))}
        </div>
      )}

      {/* 2열 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 유튜브 */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff0000" className="w-5 h-5">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <h3 className="text-sm font-semibold text-white">YouTube</h3>
            <span className="text-xs text-gray-600">"{data.keyword}"</span>
          </div>

          {yt.available ? (
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="검색 결과" value={`${yt.count}개`} />
              <StatCard label="평균 조회수" value={fmtNum(yt.avgViews)} color="text-red-400" />
              <StatCard label="최고 조회수" value={fmtNum(yt.maxViews)} />
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">검색 결과가 없어요</p>
          )}
        </div>

        {/* 스레드 */}
        <div className="bg-gray-900 border border-gray-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 192 192" fill="white" className="w-5 h-5">
              <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.372-39.134 15.265-38.105 34.569.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.05-14.127 5.177-6.6 8.452-15.153 9.898-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C88.984 150.013 83 132.995 82.667 112h-16.8c.353 24.923 7.62 44.968 21.516 59.273C101.182 185.072 122.027 192.113 148 192.351l.26-.002c29.603-.223 52.246-9.272 67.285-24.9 18.141-18.692 17.764-42.228 11.712-56.621-4.284-9.986-12.383-18.092-23.965-23.999a66.667 66.667 0 0 0-1.755-.84Z"/>
            </svg>
            <h3 className="text-sm font-semibold text-white">Threads</h3>
            <span className="text-xs text-gray-600">"{data.keyword}"</span>
          </div>

          {!th.connected ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">Meta 계정을 연결하면 스레드 데이터를 비교할 수 있어요</p>
              <a href="/api/threads/auth" className="text-xs text-teal-400 hover:text-teal-300 transition">연결하기 →</a>
            </div>
          ) : th.available ? (
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="검색 결과" value={`${th.count}개`} />
              <StatCard label="평균 반응" value={fmtNum(th.avgEngagement)} color="text-teal-400" />
              <StatCard label="바이럴 점수" value={`${th.avgViralScore}`} color={th.avgViralScore >= 50 ? "text-teal-400" : "text-gray-400"} />
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">검색 결과가 없어요</p>
          )}
        </div>
      </div>

      {/* 전략 제안 */}
      {yt.available && th.available && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">콘텐츠 전환 전략</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-white font-medium mb-1">유튜브 → 스레드</p>
              <p>유튜브 영상의 핵심 포인트를 스레드 텍스트로 요약하면</p>
              <p className="text-teal-400 font-medium mt-1">
                예상 반응: {fmtNum(Math.round(th.avgEngagement * 0.8))}~{fmtNum(Math.round(th.avgEngagement * 1.5))}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-white font-medium mb-1">스레드 → 유튜브</p>
              <p>스레드에서 반응 좋은 주제를 유튜브 영상으로 확장하면</p>
              <p className="text-red-400 font-medium mt-1">
                예상 조회수: {fmtNum(Math.round(yt.avgViews * 0.6))}~{fmtNum(Math.round(yt.avgViews * 1.2))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
