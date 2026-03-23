import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["name", "phone", "service", "goal", "budget"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  // ── 이메일 알림 (GMAIL_USER + GMAIL_APP_PASSWORD 설정 시 동작) ──
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

      await transporter.sendMail({
        from: `"TMK STUDIO 상담봇" <${gmailUser}>`,
        to: "bibl.content.official@gmail.com",
        subject: `[TMK상담] 📬 ${body.name}님 — ${body.service}`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 560px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
            <div style="background: #0d9488; padding: 28px 32px;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 800;">📬 새 상담 신청이 들어왔습니다!</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">${now}</p>
            </div>
            <div style="padding: 28px 32px; background: white;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px; width: 120px;">이름</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 700; font-size: 15px;">${body.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">연락처</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${body.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">이메일</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${body.email || "미입력"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">채널 URL</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${body.channelUrl || "없음"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">유입 경로</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${body.source || "미선택"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">관심 서비스</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #0d9488;">${body.service}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">운영 목적</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${body.goal}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 13px;">희망 예산</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600;">${body.budget}</td>
                </tr>
                ${body.message ? `
                <tr>
                  <td colspan="2" style="padding: 16px 0 0;">
                    <p style="margin: 0 0 8px; color: #888; font-size: 13px;">고민 / 전달 사항</p>
                    <div style="background: #f5f5f5; border-radius: 8px; padding: 14px 16px; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${body.message}</div>
                  </td>
                </tr>` : ""}
              </table>
            </div>
            <div style="padding: 16px 32px; background: #f9f9f9; text-align: center;">
              <a href="http://pf.kakao.com/_beBNn/chat" style="display: inline-block; background: #FEE500; color: #3A1D1D; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">카카오톡으로 답장하기</a>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("[email] 전송 실패:", err);
      // 이메일 실패해도 폼 제출은 성공으로 처리
    }
  }

  // ── Slack 웹훅 알림 (SLACK_CONTACT_WEBHOOK_URL 설정 시 동작) ──
  const webhookUrl = process.env.SLACK_CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    const text = [
      "📬 *새 상담 신청이 들어왔습니다!*",
      `• 이름: ${body.name}`,
      `• 연락처: ${body.phone}`,
      `• 이메일: ${body.email || "미입력"}`,
      `• 관심 서비스: ${body.service}`,
      `• 채널 URL: ${body.channelUrl || "없음"}`,
      `• 유입 경로: ${body.source || "미선택"}`,
      `• 운영 목적: ${body.goal}`,
      `• 희망 예산: ${body.budget}`,
      `• 고민/메모: ${body.message || "없음"}`,
    ].join("\n");

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
