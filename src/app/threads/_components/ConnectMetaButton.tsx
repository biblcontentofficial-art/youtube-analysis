"use client";

/**
 * Threads 계정 연결 카드. 연결됨: 계정 한 줄 + '연결 해제'(확인창, destructive). 연결 안 됨: 안내 + 'Threads로 연결하기'.
 * 근거: DESIGN.md 6.7 앱 카드 · 6.5 버튼 · 6.11 확인창(useConfirm)
 *
 * - 아이콘 상자·원 없이 맨 로고(DESIGN 1.3).
 * - secondary: 무료 사용자 화면처럼 같은 폴드에 흰 버튼(플랜 업그레이드)이 이미 있으면 연결 버튼을 보조 버튼으로 낮춘다(흰 면은 한 폴드에 하나).
 */
import ThreadsLogo from "./ThreadsLogo";
import { useConfirm } from "@/app/_components/ConfirmDialog";
import { buttonClass } from "@/components/ui/button";

interface Props {
  username?: string;
  secondary?: boolean;
}

const APP_CARD = "rounded-card border border-line bg-surface";

export default function ConnectMetaButton({ username, secondary = false }: Props) {
  const askConfirm = useConfirm();

  async function handleDisconnect() {
    const ok = await askConfirm({
      message: `@${username} 연결을 해제할까요?`,
      confirmText: "연결 해제",
      destructive: true,
    });
    if (!ok) return;
    await fetch("/api/threads/disconnect", { method: "DELETE" });
    window.location.reload();
  }

  if (username) {
    return (
      <div className={`${APP_CARD} flex items-center gap-3 py-3 pl-4 pr-2 md:pl-5`}>
        <ThreadsLogo decorative className="size-6 shrink-0 text-fg" />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-fg-3">연결된 계정</p>
          <p className="truncate text-ui font-semibold text-fg">@{username}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className={buttonClass({ variant: "ghost", size: "sm" }) + " pointer-coarse:h-11"}
        >
          연결 해제
        </button>
      </div>
    );
  }

  return (
    <div className={`${APP_CARD} flex flex-col items-start gap-4 p-5 md:p-6`}>
      <div>
        <p className="flex items-center gap-2 text-ui font-semibold text-fg">
          <ThreadsLogo decorative className="size-5 shrink-0" />
          Threads 계정 연결 필요
        </p>
        <p className="mt-1.5 text-body-sm text-fg-3">
          Threads 데이터를 분석하려면 본인의 Meta(Threads) 계정을 연결해야 합니다.
        </p>
      </div>
      <a href="/api/threads/auth" className={buttonClass({ variant: secondary ? "secondary" : "primary" })}>
        <ThreadsLogo decorative className="size-4" />
        Threads로 연결하기
      </a>
    </div>
  );
}
