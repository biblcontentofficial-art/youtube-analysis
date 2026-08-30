/** POST /api/community/boards — 게시판 생성 (운영진 전용, slug 중복 시 409) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canModerateCommunity, RESERVED_BOARD_SLUGS } from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canModerateCommunity(viewer)) {
    return NextResponse.json({ message: "운영진만 게시판을 만들 수 있습니다." }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(getClientIp(req), "community-board", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const slug = String(body.slug ?? "").trim().toLowerCase();
  if (!slug) return NextResponse.json({ message: "주소(slug)를 입력해주세요." }, { status: 400 });
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ message: "주소는 소문자 영문·숫자·하이픈만 사용할 수 있습니다." }, { status: 400 });
  }
  // slug 는 위에서 이미 소문자화했다 (예약어는 대소문자 무시 비교)
  if (RESERVED_BOARD_SLUGS.includes(slug)) {
    return NextResponse.json(
      { message: `사용할 수 없는 주소입니다. (${slug} 는 예약어입니다)` },
      { status: 400 }
    );
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "게시판 이름을 입력해주세요." }, { status: 400 });
  if (name.length > 40) {
    return NextResponse.json({ message: "게시판 이름은 40자 이내로 입력해주세요." }, { status: 400 });
  }

  const readRole = body.readRole === "member" ? "member" : "all";
  const writeRole = ["all", "member", "teambibl", "staff"].includes(String(body.writeRole))
    ? String(body.writeRole)
    : "member";

  const { data: dup } = await db
    .from("community_boards")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ message: "이미 사용 중인 주소입니다." }, { status: 409 });
  }

  const { data, error } = await db
    .from("community_boards")
    .insert({
      slug,
      name,
      description: body.description ? String(body.description).slice(0, 200) : null,
      group_name: body.groupName ? String(body.groupName).trim().slice(0, 30) : "커뮤니티",
      sort_order: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
      read_role: readRole,
      write_role: writeRole,
      allow_files: body.allowFiles === true,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[community:board-create]", error.message);
    return NextResponse.json({ message: "게시판 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
