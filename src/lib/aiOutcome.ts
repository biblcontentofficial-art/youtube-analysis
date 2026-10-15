/**
 * AI 호출 결과로 차감을 정하는 한 곳. 근거: docs/trend-dev/spec.md 5.2 · roadmap T0
 *
 *   const { charged } = await settleAi(reservation, result);
 *   // charged → <AiChargedError />, 아니면 <AiTemporaryError /> (실패일 때만 보여 준다)
 *
 * commit(차감): ok · refused · after_output(검증 실패·max_tokens). 일부러 거절·검증 실패를 유도해
 *               무제한 호출하는 것을 막는다.
 * release(차감 없음): unavailable · before_output(연결 오류·429·5xx·529·남은 시간 부족).
 * timeout: 사용자당 하루 2회까지 release, 그 뒤로는 commit.
 */
import { aiLimiter, decodeReservation, type AiLimiter, type AiReservation } from "./aiLimit";
import type { ClaudeResult } from "./claude";

export type AiDecision = "commit" | "release" | "timeout";

/** 결과 → 차감 규칙(시간 초과는 하루 횟수를 따로 본다) */
export function decideAi(result: ClaudeResult<unknown>): AiDecision {
  switch (result.status) {
    case "ok":
    case "refused":
      return "commit";
    case "unavailable":
      return "release";
    case "error":
      if (result.phase === "after_output") return "commit";
      if (result.phase === "timeout") return "timeout";
      return "release";
  }
}

export async function settleAi(
  reservation: AiReservation,
  result: ClaudeResult<unknown>,
  limiter: Pick<AiLimiter, "commitAi" | "releaseAi" | "timeoutRelease"> = aiLimiter,
): Promise<{ charged: boolean }> {
  let decision = decideAi(result);
  if (decision === "timeout") {
    const userId = decodeReservation(reservation.reservationId)?.userId;
    const free = userId ? await limiter.timeoutRelease(userId) : false;
    decision = free ? "release" : "commit";
  }
  if (decision === "commit") {
    await limiter.commitAi(reservation.reservationId);
    return { charged: true };
  }
  await limiter.releaseAi(reservation.reservationId);
  return { charged: false };
}
