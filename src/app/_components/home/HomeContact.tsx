/**
 * 홈 마지막 행동 #contact(DESIGN 7.1 7행). 48px 비블 아바타 + 두 톤 제목 + 흰 '채널 대행 문의하기' + 글자 링크 2개.
 * 흰 면 버튼은 첫 화면 '분석 시작'과 이것 둘(서로 다른 폴드).
 * 모션 A(소유자 결정 2026-10-17): 두 칸이 화면에 들어올 때 한 번 떠오른다(data-animate="rise").
 * 대행 문의는 결정 1 답 전까지 /studio/consulting(상담 신청).
 */
import Link from "next/link";
import ChannelAvatar from "./ChannelAvatar";

const BIBL_AVATAR =
  "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj";

export default function HomeContact() {
  return (
    <section id="contact" aria-labelledby="cta-title">
      <div className="mx-auto max-w-wide px-6 pt-16 md:pb-8 md:pt-24 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-6">
          <div data-animate="rise" className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <ChannelAvatar src={BIBL_AVATAR} size={48} className="size-12" />
              <div>
                <p className="text-ui font-bold">비블 김태민</p>
                <p className="text-caption text-fg-3">TMK STUDIO 대표</p>
              </div>
            </div>
            <h2 id="cta-title" className="mt-8 text-h3 sm:text-[40px] sm:leading-[1.2] lg:text-h1 xl:text-[56px] xl:leading-[1.15]">
              <span className="block text-fg-3">
                지금 <span className="whitespace-nowrap">채널 대행을</span> 문의해보세요
              </span>
              <span className="block">비블이 직접 채널을 관리해드립니다</span>
            </h2>
            <p className="mt-5 text-body text-fg-2 lg:text-lead">여러분의 채널에 맞는 대행 방향을 제안해드립니다.</p>
          </div>
          <div data-animate="rise" className="lg:col-span-4">
            <Link href="/studio/consulting" className="inline-flex h-14 items-center justify-center whitespace-nowrap rounded-control bg-accent px-7 text-body font-bold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-active">
              채널 대행 문의하기
            </Link>
            <div className="mt-6 flex flex-col items-start border-t border-line pt-4">
              <Link
                href="/studio/class/consulting"
                className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors duration-150 hover:text-fg-2"
              >
                1:1 팀비블 신청하기 <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg-2 transition-colors duration-150 hover:text-fg"
              >
                가볍게 시작하려면 무료로 검색 시작하기 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
