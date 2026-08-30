/**
 * 회원 등급 관리 API (운영진 전용)
 * GET  — 팀비블(3단계) 회원 목록
 * POST — { email, grade } 등급 수동 지정 (3 부여 / 2 해제)
 */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canModerateCommunity } from "@/lib/community";
import { findProfileByEmail, listGradeMembers, setMemberGrade } from "@/lib/communityDb";

async function requireModerator() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  if (!canModerateCommunity({ email: user.email, plan: user.plan })) {
    return { error: NextResponse.json({ message: "운영진만 사용할 수 있습니다." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const { error } = await requireModerator();
  if (error) return error;
  const members = await listGradeMembers(3);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireModerator();
  if (error) return error;

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email ?? "").trim();
  const grade = Number(body.grade);
  if (!email) return NextResponse.json({ message: "이메일을 입력해주세요." }, { status: 400 });
  if (![1, 2, 3].includes(grade)) {
    return NextResponse.json({ message: "등급은 1~3만 지정할 수 있습니다." }, { status: 400 });
  }

  const profile = await findProfileByEmail(email);
  if (!profile) {
    return NextResponse.json({ message: "해당 이메일의 회원을 찾을 수 없습니다." }, { status: 404 });
  }

  const err = await setMemberGrade(profile.id, grade as 1 | 2 | 3, user!.email);
  if (err) return NextResponse.json({ message: `저장 실패: ${err}` }, { status: 500 });
  return NextResponse.json({ ok: true, email: profile.email, grade });
}
