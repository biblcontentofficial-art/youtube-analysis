import type { Metadata } from "next";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ExternalLinkIcon } from "@/components/ui/icons";

// 템플릿이 " | 비블랩 (bibl lab)" 을 붙인다(여기에 접미사를 쓰면 두 번 붙는다)
export const metadata: Metadata = {
  title: "시스템 점검 중",
};

const CONTACT_EMAIL = "bibl.content.official@gmail.com";
// 전역 카카오톡 문의 버튼(KakaoChatButton)과 같은 채널 채팅
const KAKAO_CHAT_URL = "https://pf.kakao.com/_beBNn/chat";

// 점검 모드(MAINTENANCE_MODE=true)에서는 middleware 가 모든 경로를 이 화면으로 rewrite 한다.
// 404·오류 화면과 같은 틀: 큰 장식 글자 + 제목 + 설명 + 흰 버튼 하나와 보조 버튼
export default function MaintenancePage() {
  return (
    <main className="flex min-h-[60vh] items-center py-16 md:py-24">
      <Container size="reading" className="text-center">
        <div aria-hidden="true" className="text-display font-black text-fg-4">
          점검 중
        </div>
        <h1 className="mt-4 text-h4 text-fg">시스템 점검 중입니다</h1>
        <p className="mt-3 text-body-sm text-fg-3 md:text-body">
          더 나은 서비스를 위해 시스템 점검을 진행하고 있습니다.{" "}
          <br className="hidden sm:block" />
          빠르게 복구하겠습니다. 잠시만 기다려주세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass()}
          >
            카카오톡 문의
            <ExternalLinkIcon size={16} label="새 창" />
          </a>
          <a href={"mailto:" + CONTACT_EMAIL} className={buttonClass({ variant: "secondary" })}>
            이메일 문의
          </a>
        </div>
        <p className="mt-4 text-xs text-fg-3">문의: {CONTACT_EMAIL}</p>
      </Container>
    </main>
  );
}
