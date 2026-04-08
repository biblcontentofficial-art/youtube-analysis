import { timingSafeEqual } from "crypto";

/**
 * 타이밍 공격(timing attack)을 방지하는 시크릿 비교
 * - 단순 === 비교는 문자열 길이·내용에 따라 처리 시간이 달라져 brute-force에 취약
 * - crypto.timingSafeEqual()은 항상 동일한 시간에 비교 완료
 */
export function verifySecret(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      // 길이가 다른 경우에도 타이밍 정보 노출 방지를 위해 동일 길이 버퍼로 비교
      const bPadded = Buffer.alloc(a.length);
      b.copy(bPadded);
      timingSafeEqual(a, bPadded); // 의도적으로 실행 (시간 균일화)
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Authorization: Bearer <secret> 헤더 검증
 */
export function verifyBearerToken(authHeader: string | null, secret: string | null | undefined): boolean {
  if (!authHeader || !secret) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return verifySecret(token, secret);
}
