/**
 * 입력 칸·라벨·도움말·오류 문구. 보이는 라벨을 입력과 잇고, 오류는 칸 바로 아래에 둔다(ux-rules H07·H08).
 * 근거: docs/ux-renewal/ROADMAP.md R04 · spec/reference-design.md §4.4
 *
 *   <Field id="channel-url" label="채널 주소" hint="https:// 로 시작하는 주소" error={err}>
 *     {(control) => <input {...control} type="url" className={INPUT} />}
 *   </Field>
 *
 * Field 는 control 로 id · aria-describedby(도움말·오류) · aria-invalid 를 넘긴다.
 * 훅을 쓰지 않아 서버·클라이언트 컴포넌트 어디서나 쓸 수 있다.
 *
 * 포커스: 테두리 1px + 외곽선 1px 를 에메랄드로(합쳐 2px). outline-none·outline-hidden 은 넣지 않는다
 * (focus-visible:outline-* 와 같이 쓰면 외곽선 모양이 none 이 되어 링이 사라진다).
 * focus-visible:outline-solid 는 누가 outline-none 을 덧붙여도 포커스 때 선 모양을 되살린다.
 */
import type { ReactNode } from "react";
import { cx } from "./button";

const FIELD_COMMON =
  "w-full rounded-control border border-neutral-700 px-3.5 text-base text-white placeholder:text-neutral-500 transition-colors duration-150 hover:border-neutral-600 focus-visible:border-accent focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-solid focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-400 md:text-[15px]";

const FIELD_SHAPE = {
  input: "h-11",
  textarea: "min-h-28 py-2.5",
} as const;

/** 면: 페이지 위는 neutral-900, 카드 안(오목면)은 neutral-950 */
const FIELD_SURFACE = {
  page: "bg-neutral-900",
  inset: "bg-neutral-950",
} as const;

/** 한 줄 입력(44px). 모바일은 16px 글자(iOS 확대 방지), md 이상 15px */
export const INPUT = cx(FIELD_SHAPE.input, FIELD_SURFACE.page, FIELD_COMMON);

/** 여러 줄 입력 */
export const TEXTAREA = cx(FIELD_SHAPE.textarea, FIELD_SURFACE.page, FIELD_COMMON);

/** 카드 안 입력처럼 면을 한 단 낮춰야 할 때 */
export function inputClass({
  multiline = false,
  inset = false,
}: { multiline?: boolean; inset?: boolean } = {}): string {
  return cx(
    multiline ? FIELD_SHAPE.textarea : FIELD_SHAPE.input,
    inset ? FIELD_SURFACE.inset : FIELD_SURFACE.page,
    FIELD_COMMON,
  );
}

export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cx("mb-2 block text-sm font-medium text-neutral-300", className)}>
      {children}
    </label>
  );
}

export function Hint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-xs text-neutral-400">
      {children}
    </p>
  );
}

/** 오류 문구. 나타날 때 스크린 리더가 바로 읽는다(role="alert") */
export function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-400">
      {children}
    </p>
  );
}

/** Field 가 입력 요소에 넘기는 속성 */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  /** 입력 요소의 id. 라벨 htmlFor 와 도움말·오류 id 의 바탕이 된다 */
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  /** 있으면 칸 아래에 보이고 입력에 aria-invalid 가 붙는다 */
  error?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const hintId = hint ? id + "-hint" : undefined;
  const errorId = error ? id + "-error" : undefined;
  const describedBy = cx(hintId, errorId) || undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}
