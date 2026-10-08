"use client";

/**
 * 결제 실패 안내(DESIGN 6.13 상태 메시지, 오류 톤). /pricing?error=billing|payment|portone 으로 돌아왔을 때만 그린다.
 * - 결제 API 가 실패하면 이 주소로 보낸다(api/toss/**, api/checkout). 여기서는 쿼리만 읽는 표시 계층이다.
 * - 문장은 error 값별 고정 문장만 쓴다(payment/page.tsx 의 기존 문장). URL 의 message 원문은 화면에 그리지 않는다
 *   (누구나 링크로 공식 경고 상자 안에 임의 문장을 띄울 수 있게 되므로).
 * - useSearchParams 를 쓰므로 page 에서 <Suspense> 로 감싼다(감싸지 않으면 /pricing 전체가 클라이언트 렌더로 떨어진다).
 */
import { useSearchParams } from "next/navigation";
import { WarningIcon } from "@/components/ui/icons";

const MESSAGES: Record<string, { title: string; desc: string }> = {
  billing: { title: "카드 등록에 실패했습니다.", desc: "다시 시도해 주세요." },
  payment: { title: "결제에 실패했습니다.", desc: "다시 시도해 주세요." },
  portone: { title: "결제에 실패했습니다.", desc: "다시 시도해 주세요." },
};

export default function PricingNotice() {
  const params = useSearchParams();
  const error = params.get("error");
  const msg = error && Object.prototype.hasOwnProperty.call(MESSAGES, error) ? MESSAGES[error] : null;
  if (!msg) return null;

  return (
    <div
      role="alert"
      className="mt-8 flex max-w-xl gap-3 rounded-card border border-negative/55 bg-surface p-4"
    >
      <WarningIcon size={20} className="mt-0.5 text-negative" />
      <div>
        <p className="text-ui font-semibold text-negative">{msg.title}</p>
        <p className="mt-0.5 text-body-sm text-fg-3">{msg.desc}</p>
      </div>
    </div>
  );
}
