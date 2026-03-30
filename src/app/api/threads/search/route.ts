/**
 * GET /api/threads/search?q=keyword&filter=all&cursor=xxx
 * 스레드 키워드 검색 — 바이럴 점수 + 아웃라이어 포함
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchThreads, filterByMediaType } from "@/lib/threads";
import { getThreadsConnection } from "@/lib/db";
import { incrementThreadsCount } from "@/lib/threadsLimit";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const filter = (searchParams.get("filter") ?? "all") as "all" | "text" | "image" | "video";
  const cursor = searchParams.get("cursor") ?? undefined;

  if (!q) {
    return NextResponse.json({ error: "검색어를 입력해주세요" }, { status: 400 });
  }

  // Meta 계정 연결 여부 확인
  const connection = await getThreadsConnection(userId);
  if (!connection) {
    return NextResponse.json(
      { error: "META_NOT_CONNECTED", message: "Meta 계정을 먼저 연결해주세요" },
      { status: 403 }
    );
  }

  // 검색 횟수 제한 체크 + 증가
  const { ok, used, limit } = await incrementThreadsCount();
  if (!ok) {
    return NextResponse.json(
      {
        error: "SEARCH_LIMIT_EXCEEDED",
        message: `검색 한도(${limit}회)를 초과했습니다. 플랜을 업그레이드하면 더 많이 검색할 수 있어요.`,
        used,
        limit,
      },
      { status: 429 }
    );
  }

  try {
    const result = await searchThreads(q, connection.access_token, cursor);

    // 미디어 타입 필터 적용
    const filtered = filterByMediaType(result.posts, filter);

    return NextResponse.json({
      posts: filtered,
      cursor: result.cursor,
      used,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // 토큰 만료 시 연결 해제 안내
    if (message.includes("190") || message.includes("invalid_token")) {
      return NextResponse.json(
        { error: "TOKEN_EXPIRED", message: "Meta 연결이 만료됐어요. 다시 연결해주세요." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
