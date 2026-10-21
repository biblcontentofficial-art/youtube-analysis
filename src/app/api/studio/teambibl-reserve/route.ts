import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/** HTML 특수문자 이스케이프 (XSS/이메일 인젝션 방지) */
function escHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const AGE_OPTIONS = ["20대 이하", "30대", "40대", "50대", "60대 이상"];
const STATUS_OPTIONS = ["운영 중", "준비 중"];

/**
 * 팀비블 5기 사전예약 접수 (소유자 요청 2026-10-21: 4기 마감, 결제 대신 사전예약)
 * body: name, phone, age, topic, status, youtubeUrl?, privacyConsent
 * → bibl.content.official@gmail.com 으로 메일 발송(주 경로) + teambibl_reservations 저장(best-effort, 테이블 없으면 무시)
 * 메일이 실패하면 500 을 돌려 신청자가 다시 보내게 한다(접수됐다고 잘못 안내하지 않게).
 */
export async function POST(req: NextRequest) {
  // IP 기반 Rate Limit: 시간당 5회 (스팸 방지)
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(ip, "teambibl-reserve", 5, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const body = {
    name: str("name"),
    phone: str("phone"),
    age: str("age"),
    topic: str("topic"),
    status: str("status"),
    youtubeUrl: str("youtubeUrl"),
    privacyConsent: str("privacyConsent"),
  };

  // 필수 항목 · 선택지 · 길이 검증
  for (const field of ["name", "phone", "age", "topic", "status"] as const) {
    if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
  }
  if (body.privacyConsent !== "동의") {
    return NextResponse.json({ error: "privacy consent required" }, { status: 400 });
  }
  if (!AGE_OPTIONS.includes(body.age) || !STATUS_OPTIONS.includes(body.status)) {
    return NextResponse.json({ error: "invalid option" }, { status: 400 });
  }
  const digits = body.phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) {
    return NextResponse.json({ error: "invalid phone" }, { status: 400 });
  }
  if (
    body.name.length > 50 ||
    body.phone.length > 30 ||
    body.topic.length > 200 ||
    body.youtubeUrl.length > 300
  ) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  // ── Supabase DB 저장 (best-effort — 테이블 없으면 조용히 무시) ──
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("teambibl_reservations").insert({
      cohort: 5,
      name: body.name,
      phone: body.phone,
      age: body.age,
      topic: body.topic,
      status: body.status,
      youtube_url: body.youtubeUrl || null,
      privacy_consent: body.privacyConsent,
    });
    if (error) console.error("[supabase] 팀비블 사전예약 저장 실패:", error.message);
  }

  // ── 이메일 알림 ──
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.warn("[teambibl-reserve] GMAIL 미설정 — 이메일 발송 생략");
    return NextResponse.json({ ok: true });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    const row = (label: string, value: string, strong = false) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px; width: 120px; vertical-align: top;">${escHtml(label)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; ${strong ? "font-weight: 700;" : ""}">${escHtml(value)}</td>
      </tr>`;

    await transporter.sendMail({
      from: `"비블 팀비블 사전예약봇" <${gmailUser}>`,
      to: "bibl.content.official@gmail.com",
      subject: `[팀비블 5기 사전예약] ${body.name}님 · ${body.age} · ${body.status}`,
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 24px 32px;">
            <p style="margin: 0; color: #bbb; font-size: 13px;">${escHtml(now)}</p>
            <h1 style="margin: 6px 0 0; color: #fff; font-size: 20px;">팀비블 5기 사전예약이 들어왔습니다</h1>
          </div>
          <div style="padding: 24px 32px; background: #fff;">
            <table style="width: 100%; border-collapse: collapse;">
              ${row("이름", body.name, true)}
              ${row("연락처", body.phone, true)}
              ${row("연령대", body.age)}
              ${row("채널 주제", body.topic)}
              ${row("운영 여부", body.status)}
              ${row("유튜브 URL", body.youtubeUrl || "미입력")}
              ${row("개인정보 수집·이용 동의", body.privacyConsent)}
            </table>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] 팀비블 사전예약 전송 실패:", err);
    return NextResponse.json(
      { error: "EMAIL_FAILED", message: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
