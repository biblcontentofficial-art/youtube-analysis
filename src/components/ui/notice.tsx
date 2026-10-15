/**
 * 트렌드 서치 안내 문구 부품(서버·클라이언트 공용, 훅 없음).
 * 근거: docs/trend-dev/spec.md 2.1 · DESIGN.md 6.13(안내 상자) · 7.2 4-1(디스클레이머 mt-1.5 text-micro text-fg-3)
 *
 *   <DerivedNotice what="채널 수 변화와 배수는" />   숫자를 새로 만드는 표 바로 아래. what 에 조사까지 넣는다
 *   <AiNotice />                                     Claude 결과 바로 아래
 *   <AiLockedButton />                               GET /api/ai/usage 의 available 이 false 일 때 버튼 자리
 *   <AiTemporaryError /> / <AiChargedError />         settleAi() 의 charged 로 고른다
 *
 * 문구는 spec 2.1 그대로(조사 붙여 씀: 'bibl lab이', 'YouTube의'). 고칠 때는 spec 도 같이 고친다.
 */
import { cx } from "./button";
import { InfoIcon, LockIcon } from "./icons";

const NOTE = "mt-1.5 text-micro text-fg-3";
const STATUS_BOX = "flex gap-3 rounded-card border border-line bg-surface p-4";

/** 파생값 안내. what 예: '채널 수 변화와 배수는', '등장 일수와 영상 수는' */
export function DerivedNotice({ what, extra, className }: { what: string; extra?: string; className?: string }) {
  return (
    <p className={cx(NOTE, className)}>
      {what} YouTube API Services로 받은 공개 값을 단순 계산한 참고값이며, YouTube 공식 지표나 bibl lab의 평가가 아닙니다.
      {extra ? ` ${extra}` : null}
    </p>
  );
}

/** 외부 AI 생성 안내(VideoModal 의 같은 문장에서 공급자 이름만 다름) */
export function AiNotice({ className }: { className?: string }) {
  return (
    <p className={cx(NOTE, className)}>
      ※ 외부 AI 서비스(Anthropic Claude)가 생성한 텍스트입니다. bibl lab이 제공하는 메트릭이나 평가가 아니며, YouTube의 공식 정보도 아닙니다.
    </p>
  );
}

/**
 * 키가 없을 때(available:false) AI 버튼 자리. 누를 수 있는 버튼을 두고 오류를 띄우지 않는다.
 * 잠금 보조 버튼(DESIGN 6.5 잠김: 보조 + 라벨 text-fg-3). disabled 라 흐리게 하지 않고 라벨 색으로만 잠김을 보인다.
 */
export function AiLockedButton({ label = "AI 기능 준비 중", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      disabled
      className={cx(
        "inline-flex h-9 cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-control border border-line-strong bg-surface px-3.5 text-body-sm font-semibold text-fg-3 pointer-coarse:h-11",
        className,
      )}
    >
      <LockIcon size={16} />
      {label}
    </button>
  );
}

/**
 * role: 사용자가 누른 동작 뒤에 나타나면 "alert"(기본, 바로 읽음).
 * 화면을 처음 그릴 때부터 보이는 자리라면 "status" 를 넘긴다(페이지를 열자마자 읽지 않게).
 */
type StatusRole = "alert" | "status";

function StatusBox({ title, body, className, role = "alert" }: { title: string; body?: string; className?: string; role?: StatusRole }) {
  return (
    <div role={role} className={cx(STATUS_BOX, className)}>
      <InfoIcon className="mt-0.5 text-fg-2" />
      <div className="min-w-0">
        <p className="text-ui font-semibold text-fg">{title}</p>
        {body ? <p className="mt-0.5 text-body-sm text-fg-3">{body}</p> : null}
      </div>
    </div>
  );
}

/** 모델 응답 전에 실패(연결 오류·429·5xx·과부하·전체 한도 초과). 차감 없음 */
export function AiTemporaryError({ className, role }: { className?: string; role?: StatusRole }) {
  return (
    <StatusBox
      role={role}
      title="AI 응답을 받지 못했습니다"
      body="잠시 뒤 다시 시도해 주세요. 사용 횟수는 차감되지 않았습니다."
      className={className}
    />
  );
}

/** 모델이 응답을 만든 뒤 실패(거절·검증 실패·길이 초과·하루 2회를 넘은 시간 초과). 차감됨 */
export function AiChargedError({ className, role }: { className?: string; role?: StatusRole }) {
  return <StatusBox role={role} title="결과를 만들지 못했습니다" body="이번 시도는 사용 횟수에 포함됐어요." className={className} />;
}
