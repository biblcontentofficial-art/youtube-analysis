/**
 * 팀비블 멤버십 관리 API (운영자 전용)
 * GET  — 팀비블 수강생 목록
 * POST — { email, isTeambibl } 수강생 지정·해제
 * 활동 등급(새싹~다이아)은 점수로 자동 승급하므로 수동 조작 대상이 아니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canModerateCommunity } from "@/lib/community";
import { findProfileByEmail, listTeambiblMembers, setTeambibl } from "@/lib/communityDb";

async function requireModerator() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  if (!canModerateCommunity({ email: user.email, plan: user.plan })) {
    return { error: NextResponse.json({ message: "운영자만 사용할 수 있습니다." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const { error } = await requireModerator();
  if (error) return error;
  const members = await listTeambiblMembers();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireModerator();
  if (error) return error;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email ?? "").trim();
  const isTeambibl = body.isTeambibl === true;
  if (!email) return NextResponse.json({ message: "이메일을 입력해주세요." }, { status: 400 });

  const profile = await findProfileByEmail(email);
  if (!profile) {
    return NextResponse.json({ message: "해당 이메일의 회원을 찾을 수 없습니다." }, { status: 404 });
  }

  const err = await setTeambibl(profile.id, isTeambibl, user!.email);
  if (err) return NextResponse.json({ message: `저장 실패: ${err}` }, { status: 500 });
  return NextResponse.json({ ok: true, email: profile.email, isTeambibl });
}
