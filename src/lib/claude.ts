/**
 * 트렌드 서치 공용 Claude 클라이언트(서버 전용).
 * 근거: docs/trend-dev/spec.md 4.1 · roadmap T0
 *
 *   const r = await callClaudeJson<Plan>({
 *     tier: "light", system: SYSTEM, content: `<user_topic>${escapeForTag(topic)}</user_topic>`,
 *     schema: PLAN_SCHEMA, maxTokens: 4000, validate: parsePlan,
 *     deadline: startedAt + 55_000, capMs: 25_000,
 *   });
 *   // r.status: "ok" | "unavailable" | "refused" | "error"(phase 로 차감 여부를 정한다, aiOutcome.ts)
 *
 * 구현 메모
 * - @anthropic-ai/sdk 를 설치하지 않고(이번 작업 규칙: 의존성 추가 금지) 기존 /api/ai-analyze·/api/keyword-insight 와
 *   같은 방식으로 Messages API 를 fetch 로 직접 부른다. SDK 로 바꿀 때도 요청 본문·결과 모양은 그대로 둔다.
 *   SDK 의 기본 재시도(maxRetries 2)에 해당하는 것은 없다: 이 함수는 한 번만 보낸다(maxRetries 0 과 같음).
 * - 키 이름은 기존 ANTHROPIC_API_KEY(소유자 확정 2026-10-15). 키가 없으면 fetch 를 만들지도 않고 unavailable.
 * - 모델은 환경 변수로 바꿀 수 있다: CLAUDE_MODEL_MAIN(기본 claude-sonnet-5-5), CLAUDE_MODEL_LIGHT(기본 claude-haiku-4-5-20251001, 소유자 지정 ID).
 * - Sonnet 5.5 에만 thinking {type:"between_tools"} + output_config.effort + fallbacks "default"
 *   (beta server-side-fallback-2026-07-01) 를 보낸다. Haiku 에는 셋 다 보내지 않는다.
 *   첫 실제 호출에서 between_tools 와 구조화 출력·fallbacks 조합이 400 이면 between_tools 를 빼고 effort 만 둔다(roadmap T0 risks).
 * - 사용자 입력·제3자 텍스트는 system 에 넣지 않는다. content 안의 태그 안에만, escapeForTag() 를 거쳐 넣는다.
 */

export type ClaudeTier = "main" | "light";
export type ClaudeEffort = "low" | "medium" | "high";

export const CLAUDE_MODELS: Record<ClaudeTier, string> = {
  main: process.env.CLAUDE_MODEL_MAIN || "claude-sonnet-5-5",
  light: process.env.CLAUDE_MODEL_LIGHT || "claude-haiku-4-5-20251001",
};

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
/** 마감 전에 남겨 둘 여유(응답 저장·차감 정리 시간) */
const DEADLINE_MARGIN_MS = 5_000;

export type ClaudeUsage = { input_tokens: number; output_tokens: number };

export type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } | { type: "base64"; media_type: string; data: string } };

export type ClaudeResult<T> =
  | { status: "ok"; data: T; model: string; usage: ClaudeUsage }
  | { status: "unavailable" }
  | { status: "refused"; usage?: ClaudeUsage }
  | { status: "error"; phase: "before_output" | "after_output" | "timeout"; message: string; usage?: ClaudeUsage };

export type CallClaudeJsonArgs<T> = {
  tier: ClaudeTier;
  /** 고정 규칙만. 사용자 입력·영상 제목 금지 */
  system: string;
  /** user 메시지. 문자열이거나 텍스트·이미지 블록 */
  content: string | ClaudeContentBlock[];
  /** output_config.format 의 JSON Schema */
  schema: Record<string, unknown>;
  maxTokens: number;
  /** Sonnet 5.5 에서만 보낸다(between_tools 는 high 이하만 허용) */
  effort?: ClaudeEffort;
  /** 받은 JSON 을 손으로 다시 검증·정리. 통과 못 하면 null → after_output */
  validate: (value: unknown) => T | null;
  /** 요청 전체 마감 시각(ms, Date.now() 기준) */
  deadline: number;
  /** 기능별 시간 상한(ms) */
  capMs: number;
};

export function claudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * 이번 호출에 줄 시간(ms). timeout = min(capMs, deadline − now − 5초).
 * 그 값이 capMs 의 절반보다 작으면 부르지 않는다(null).
 */
export function planTimeoutMs(deadline: number, capMs: number, now: number = Date.now()): number | null {
  const timeout = Math.min(capMs, deadline - now - DEADLINE_MARGIN_MS);
  if (timeout < capMs / 2) return null;
  return Math.floor(timeout);
}

function isSonnet55(model: string): boolean {
  return model.startsWith("claude-sonnet-5-5");
}

/** Messages API 요청 본문과 헤더(키 제외). 시험에서 모양을 확인할 수 있게 따로 둔다 */
export function buildClaudeRequest<T>(args: CallClaudeJsonArgs<T>): { body: Record<string, unknown>; beta: string | null } {
  const model = CLAUDE_MODELS[args.tier];
  const sonnet = isSonnet55(model);
  const outputConfig: Record<string, unknown> = { format: { type: "json_schema", schema: args.schema } };
  if (sonnet && args.effort) outputConfig.effort = args.effort;
  const body: Record<string, unknown> = {
    model,
    max_tokens: args.maxTokens,
    system: args.system,
    messages: [{ role: "user", content: args.content }],
    output_config: outputConfig,
  };
  if (sonnet) {
    body.thinking = { type: "between_tools" };
    body.fallbacks = "default";
  }
  return { body, beta: sonnet ? FALLBACK_BETA : null };
}

function readUsage(raw: unknown): ClaudeUsage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  return { input_tokens: Number(u.input_tokens) || 0, output_tokens: Number(u.output_tokens) || 0 };
}

/** 응답 본문(JSON)을 결과로 바꾼다. 시험에서 고정 응답으로 확인한다 */
export function parseClaudeResponse<T>(json: unknown, validate: (value: unknown) => T | null): ClaudeResult<T> {
  if (!json || typeof json !== "object") {
    return { status: "error", phase: "after_output", message: "invalid_response" };
  }
  const msg = json as { stop_reason?: unknown; content?: unknown; model?: unknown; usage?: unknown };
  const usage = readUsage(msg.usage);
  if (msg.stop_reason === "refusal") return { status: "refused", usage };
  if (msg.stop_reason === "max_tokens") {
    return { status: "error", phase: "after_output", message: "max_tokens", usage };
  }
  // fallback·thinking 블록은 건너뛰고 text 블록만 잇는다(구조화 출력은 text 블록 하나)
  const blocks = Array.isArray(msg.content) ? msg.content : [];
  const text = blocks
    .filter((b): b is { type: "text"; text: string } => !!b && typeof b === "object" && (b as { type?: unknown }).type === "text" && typeof (b as { text?: unknown }).text === "string")
    .map((b) => b.text)
    .join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "error", phase: "after_output", message: "json_parse", usage };
  }
  // 검증 함수가 예외를 던져도 reject 하지 않는다. 출력은 이미 만들어졌으므로 after_output(차감)으로 돌려
  // 호출한 쪽의 settleAi 가 반드시 실행되게 한다
  let data: T | null;
  try {
    data = validate(parsed);
  } catch (e) {
    console.error("[claude] validate threw:", e);
    data = null;
  }
  if (data === null) return { status: "error", phase: "after_output", message: "validation", usage };
  return {
    status: "ok",
    data,
    model: typeof msg.model === "string" ? msg.model : "",
    usage: usage ?? { input_tokens: 0, output_tokens: 0 },
  };
}

export async function callClaudeJson<T>(args: CallClaudeJsonArgs<T>): Promise<ClaudeResult<T>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { status: "unavailable" };

  const timeoutMs = planTimeoutMs(args.deadline, args.capMs);
  if (timeoutMs === null) return { status: "error", phase: "before_output", message: "not_enough_time" };

  const { body, beta } = buildClaudeRequest(args);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": API_VERSION,
  };
  if (beta) headers["anthropic-beta"] = beta;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetch(API_URL, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
    } catch (e) {
      if (controller.signal.aborted) return { status: "error", phase: "timeout", message: "timeout" };
      // 연결 오류: 모델이 아무것도 만들기 전
      return { status: "error", phase: "before_output", message: `connection: ${e instanceof Error ? e.message : String(e)}` };
    }
    if (!res.ok) {
      // 429·5xx·529(과부하)와 그 밖의 4xx 모두 출력 전 실패. 본문은 로그용으로만 짧게 읽는다
      let detail = "";
      try { detail = (await res.text()).slice(0, 300); } catch {}
      if (detail) console.error(`[claude] HTTP ${res.status}:`, detail);
      return { status: "error", phase: "before_output", message: `http_${res.status}` };
    }
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      if (controller.signal.aborted) return { status: "error", phase: "timeout", message: "timeout" };
      return { status: "error", phase: "after_output", message: "invalid_response" };
    }
    return parseClaudeResponse(json, args.validate);
  } finally {
    clearTimeout(timer);
  }
}
