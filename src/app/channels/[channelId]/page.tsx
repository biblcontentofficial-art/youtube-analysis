import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { getChannelDetail, getChannelRecentVideos } from "@/lib/youtube";
import { WarningIcon } from "@/components/ui/icons";
import ToolTabs from "../../_components/ToolTabs";
import BackToChannelsLink from "./_components/BackToChannelsLink";
import ChannelDetailView from "./_components/ChannelDetailView";

/**
 * 상세의 "채널 찾기로 돌아가기" 주소. 목록이 넘겨 준 from 은 경로가 정확히 /channels 일 때만 쓴다.
 * URL 로 정규화해서 외부 주소(https://…, //…)와 경로 이탈(/channels/../search)을 걸러 내고,
 * 결과는 늘 '/channels' + 쿼리라서 다른 사이트나 다른 화면으로 가지 않는다.
 * searchParams 는 이미 한 번 디코딩된 값이므로 decodeURIComponent 를 다시 하지 않는다
 * (두 번 풀면 검색어의 & · # 에서 주소가 잘린다).
 */
function channelsBackHref(rawFrom: string | undefined): string {
  if (!rawFrom) return "/channels";
  try {
    const url = new URL(rawFrom, "http://localhost");
    if (url.pathname === "/channels") return `/channels${url.search}`;
  } catch {
    // 읽을 수 없는 값은 기본 주소로
  }
  return "/channels";
}

// ─── 메타데이터 ───────────────────────────────────────────────────────────────
// title 뒤 '| 비블랩 (bibl lab)' 은 루트 레이아웃 template 이 붙인다(여기서 다시 붙이지 않는다).

export async function generateMetadata({
  params,
}: {
  params: { channelId: string };
}): Promise<Metadata> {
  const canonical = `https://bibllab.com/channels/${params.channelId}`;
  const { channel } = await getChannelDetail(params.channelId);
  if (!channel) return { title: "채널 정보", alternates: { canonical } };
  return {
    title: `${channel.title} · 채널 분석`,
    description: `${channel.title} 채널의 구독자 수, 평균 조회수, 성장률 등 핵심 지표를 비블랩에서 확인하세요.`,
    alternates: { canonical },
  };
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

interface Props {
  params: { channelId: string };
  searchParams: { from?: string | string[] };
}

export default async function ChannelDetailPage({ params, searchParams }: Props) {
  const user = await currentUser();
  const plan = (user?.plan as string) ?? "free";
  const isPaid = plan !== "free";

  // 데이터 병렬 페치
  const [{ channel, error }, { videos }] = await Promise.all([
    getChannelDetail(params.channelId, isPaid),
    getChannelRecentVideos(params.channelId, isPaid),
  ]);

  // 돌아가기 주소 (from 이 여러 개면 첫 값)
  const backHref = channelsBackHref(
    Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from
  );

  if (!channel) {
    if (error === "not_found") notFound();
    // API 오류: 상태 화면(DESIGN 6.18). 돌아가기는 목록 복귀 규칙 그대로(BackToChannelsLink)
    return (
      <main className="min-h-screen bg-canvas text-fg">
        <ToolTabs current="/channels" />
        <div className="flex min-h-[60vh] items-center py-16 md:py-24">
          <div className="mx-auto w-full max-w-reading px-6 text-center lg:px-8">
            <WarningIcon size={24} className="mx-auto text-negative" />
            <h1 className="mt-4 text-h4 text-fg">채널 정보를 불러오지 못했습니다</h1>
            <p className="mt-3 text-body-sm text-fg-3 md:text-body">
              {error === "quota_exceeded"
                ? "YouTube API 일일 쿼터가 소진됐습니다. 잠시 후 다시 시도해주세요."
                : "일시적인 오류입니다. 잠시 후 다시 시도해주세요."}
            </p>
            <div className="mt-6 flex justify-center">
              <BackToChannelsLink href={backHref} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <ChannelDetailView channel={channel} videos={videos} backHref={backHref} />;
}
