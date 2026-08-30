/** PATCH·DELETE /api/community/boards/[id] — 게시판 수정 / 비활성화 (운영진 전용) */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { canModerateCommunity, RESERVED_BOARD_SLUGS } from "@/lib/community";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canModerateCommunity(viewer)) {
    return NextResponse.json({ message: "운영진만 게시판을 수정할 수 있습니다." }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(getClientIp(req), "community-board-edit", 120, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const { data: board } = await db
    .from("community_boards")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();
  if (!board) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const patch: Record<string, unknown> = {};

  if (body.slug !== undefined) {
    const slug = String(body.slug ?? "").trim().toLowerCase();
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
    if (slug !== board.slug) {
      const { data: dup } = await db
        .from("community_boards")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (dup) return NextResponse.json({ message: "이미 사용 중인 주소입니다." }, { status: 409 });
      patch.slug = slug;
    }
  }

  if (body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ message: "게시판 이름을 입력해주세요." }, { status: 400 });
    if (name.length > 40) {
      return NextResponse.json({ message: "게시판 이름은 40자 이내로 입력해주세요." }, { status: 400 });
    }
    patch.name = name;
  }

  if (body.description !== undefined) {
    const desc = String(body.description ?? "").trim();
    patch.description = desc ? desc.slice(0, 200) : null;
  }

  if (body.groupName !== undefined) {
    const group = String(body.groupName ?? "").trim();
    if (!group) return NextResponse.json({ message: "그룹 이름을 입력해주세요." }, { status: 400 });
    patch.group_name = group.slice(0, 30);
  }

  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ message: "정렬 순서는 숫자여야 합니다." }, { status: 400 });
    }
    patch.sort_order = Math.trunc(n);
  }

  if (body.readRole !== undefined) {
    if (body.readRole !== "all" && body.readRole !== "member") {
      return NextResponse.json({ message: "읽기 권한 값이 올바르지 않습니다." }, { status: 400 });
    }
    patch.read_role = body.readRole;
  }

  if (body.writeRole !== undefined) {
    if (!["all", "member", "teambibl", "staff"].includes(String(body.writeRole))) {
      return NextResponse.json({ message: "쓰기 권한 값이 올바르지 않습니다." }, { status: 400 });
    }
    patch.write_role = body.writeRole;
  }

  if (body.allowFiles !== undefined) patch.allow_files = body.allowFiles === true;
  if (body.isActive !== undefined) patch.is_active = body.isActive === true;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await db.from("community_boards").update(patch).eq("id", id);
  if (error) {
    console.error("[community:board-update]", error.message);
    return NextResponse.json({ message: "게시판 수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const viewer = { id: user.id, email: user.email, plan: user.plan };
  if (!canModerateCommunity(viewer)) {
    return NextResponse.json({ message: "운영진만 게시판을 삭제할 수 있습니다." }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(getClientIp(req), "community-board-delete", 60, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const db = getSupabase();
  if (!db) return NextResponse.json({ message: "DB 미연결" }, { status: 500 });

  const { data: board } = await db
    .from("community_boards")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!board) return NextResponse.json({ message: "게시판을 찾을 수 없습니다." }, { status: 404 });

  const { error } = await db.from("community_boards").update({ is_active: false }).eq("id", id);
  if (error) {
    console.error("[community:board-delete]", error.message);
    return NextResponse.json({ message: "게시판 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
