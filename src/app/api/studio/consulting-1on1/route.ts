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

/**
 * 1:1 유튜브 컨설팅 신청 접수
 * body: name, gender, age, phone, email, service, source, reason,
 *       snsUrl?, bizName?, bizNumber?, taxEmail?, payMethod, waitConsent, privacyConsent
 * → bibl.content.official@gmail.com 으로 신청서 발송
 */
export async function POST(req: NextRequest) {
  // IP 기반 Rate Limit: 시간당 5회 (스팸 방지)
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(ip, "consulting-1on1", 5, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 필수 항목 검증
  const required = ["name", "gender", "age", "phone", "email", "service", "source", "reason", "payMethod"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }
  // 동의 필수
  if (body.privacyConsent !== "동의") {
    return NextResponse.json({ error: "privacy consent required" }, { status: 400 });
  }
  if (body.waitConsent !== "동의" && body.waitConsent !== "비동의") {
    return NextResponse.json({ error: "waitConsent invalid" }, { status: 400 });
  }

  // 길이 제한
  if (
    body.name.length > 50 ||
    body.phone.length > 30 ||
    body.email.length > 120 ||
    (body.reason?.length ?? 0) > 3000 ||
    (body.bizNumber?.length ?? 0) > 40 ||
    (body.snsUrl?.length ?? 0) > 300
  ) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  // ── Supabase DB 저장 (best-effort — 테이블 없으면 조용히 무시) ──
  const supabase = getSupabase();
  if (supabase) {
    supabase
      .from("consulting_1on1_submissions")
      .insert({
        name: body.name,
        gender: body.gender,
        age: body.age,
        phone: body.phone,
        email: body.email,
        service: body.service,
        source: body.source,
        reason: body.reason,
        sns_url: body.snsUrl || null,
        biz_name: body.bizName || null,
        biz_number: body.bizNumber || null,
        tax_email: body.taxEmail || null,
        pay_method: body.payMethod,
        wait_consent: body.waitConsent,
        privacy_consent: body.privacyConsent,
      })
      .then(({ error }) => {
        if (error) console.error("[supabase] 1:1 상담 저장 실패:", error.message);
      });
  }

  // ── 이메일 알림 ──
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

      const row = (label: string, value: string, strong = false) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px; width: 150px; vertical-align: top;">${escHtml(label)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; ${strong ? "font-weight: 700; color: #0d9488;" : ""}">${escHtml(value)}</td>
        </tr>`;

      await transporter.sendMail({
        from: `"비블 1:1 컨설팅 신청봇" <${gmailUser}>`,
        to: "bibl.content.official@gmail.com",
        replyTo: body.email,
        subject: `[1:1 컨설팅 신청] ${escHtml(body.name)}님 — ${escHtml(body.age)}`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
            <div style="background: #0d9488; padding: 28px 32px;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 800;">🎯 새 1:1 유튜브 컨설팅 신청</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">${now}</p>
            </div>
            <div style="padding: 28px 32px; background: white;">
              <table style="width: 100%; border-collapse: collapse;">
                ${row("성함", body.name, true)}
                ${row("성별", body.gender)}
                ${row("연령", body.age)}
                ${row("휴대폰 번호", body.phone)}
                ${row("이메일", body.email)}
                ${row("희망 서비스", body.service, true)}
                ${row("유입 경로", body.source)}
                ${row("운영 SNS URL", body.snsUrl || "미입력")}
                ${row("사업자명", body.bizName || "미입력")}
                ${row("사업자등록번호", body.bizNumber || "미입력")}
                ${row("세금계산서 이메일", body.taxEmail || "미입력")}
                ${row("결제 수단", body.payMethod)}
                ${row("다음 기수 대기 동의", body.waitConsent)}
                ${row("개인정보 수집·이용 동의", body.privacyConsent, true)}
                <tr>
                  <td colspan="2" style="padding: 18px 0 0;">
                    <p style="margin: 0 0 8px; color: #888; font-size: 13px;">컨설팅 신청 사유</p>
                    <div style="background: #f5f5f5; border-radius: 8px; padding: 14px 16px; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${escHtml(body.reason)}</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="padding: 16px 32px; background: #f9f9f9; text-align: center;">
              <a href="mailto:${escHtml(body.email)}" style="display: inline-block; background: #0d9488; color: #fff; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">신청자에게 이메일 답장</a>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("[email] 1:1 컨설팅 신청 전송 실패:", err);
      return NextResponse.json(
        { error: "EMAIL_FAILED", message: "신청 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }
  } else {
    console.warn("[consulting-1on1] GMAIL 미설정 — 이메일 발송 생략");
  }

  return NextResponse.json({ ok: true });
}
