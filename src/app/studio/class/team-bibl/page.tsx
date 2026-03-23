import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "유튜브 팀비블 참여 안내 — TMK STUDIO",
  description:
    "비블과 함께하는 10개월 유튜브 성장 여정. 월 멤버십 구독 후 라이브 클래스에 참여하세요.",
};

const STEPS = [
  {
    num: 1,
    title: "월 구독 신청",
    desc: "아래 수강신청 버튼을 눌러 bibl lab 월 멤버십을 구독해주세요.",
  },
  {
    num: 2,
    title: "강의 사이트 접속",
    desc: "구독 완료 후 bibl.liveklass.com 강의 페이지로 이동해 '클래스 신청'을 클릭하세요.",
    link: { label: "bibl.liveklass.com 강의 바로가기", url: "https://bibl.liveklass.com/classes/284675" },
  },
  {
    num: 3,
    title: "쿠폰 등록",
    desc: "월 멤버십 가입 후 카카오 알림톡으로 발송된 쿠폰번호를 입력해주세요.",
  },
  {
    num: 4,
    title: "0원 신청 완료",
    desc: "쿠폰 적용으로 결제금액이 0원이 된 것을 확인 후 필수동의를 체크하고 신청하기를 눌러주세요.",
  },
  {
    num: 5,
    title: "즉시 수강 시작",
    desc: "신청 완료 후 바로 강의를 수강할 수 있습니다. 팀비블 멤버분들과 10개월 유튜브 여정을 함께합니다.",
  },
];

export default function TeamBiblPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 상단 브레드크럼 */}
      <div className="max-w-screen-md mx-auto px-4 pt-8">
        <Link
          href="/studio/class"
          className="text-xs text-gray-500 hover:text-gray-300 transition inline-flex items-center gap-1 mb-6"
        >
          ← 강의 목록
        </Link>
      </div>

      {/* 남은 자리 배지 */}
      <div className="max-w-screen-md mx-auto px-4 mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          남은 자리 : 3명
        </span>
      </div>

      {/* 메인 이미지 섹션 — 노션 페이지 이미지 그대로 */}
      <div className="max-w-screen-md mx-auto px-4 space-y-0">
        {[
          { src: "/studio/team-bibl/01.png", alt: "팀비블 소개 01" },
          { src: "/studio/team-bibl/02.png", alt: "팀비블 소개 02" },
          { src: "/studio/team-bibl/03.png", alt: "팀비블 소개 03" },
          { src: "/studio/team-bibl/04.png", alt: "팀비블 소개 04" },
          { src: "/studio/team-bibl/05.png", alt: "팀비블 소개 05" },
          { src: "/studio/team-bibl/06.png", alt: "팀비블 소개 06" },
        ].map((img) => (
          <div key={img.src} className="w-full">
            <Image
              src={img.src}
              alt={img.alt}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        ))}
      </div>

      {/* 수강신청 CTA */}
      <div className="max-w-screen-md mx-auto px-4 py-10 text-center">
        <a
          href="https://bibllab.com/pricing"
          className="inline-flex items-center justify-center gap-2 w-full max-w-md px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-lg transition shadow-lg shadow-teal-900/40"
        >
          수강신청 하기
        </a>
        <p className="text-xs text-gray-500 mt-3">월 멤버십 구독 후 쿠폰으로 강의 0원 수강</p>
      </div>

      {/* 결제 및 강의 이용방법 */}
      <div className="max-w-screen-md mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 md:p-8">
          <h2 className="text-lg font-bold mb-6 text-amber-400">결제 및 강의 이용방법</h2>
          <ol className="space-y-6">
            {STEPS.map((step) => (
              <li key={step.num} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600/20 border border-teal-600/40 flex items-center justify-center text-teal-400 font-bold text-sm">
                  {step.num}
                </div>
                <div className="pt-0.5">
                  <p className="font-semibold text-white mb-1">{step.title}</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  {step.link && (
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2"
                    >
                      {step.link.label} →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* 문의 */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500 mb-3">쿠폰을 받지 못하셨거나 문의사항이 있으시면</p>
            <a
              href="http://pf.kakao.com/_beBNn/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm transition"
            >
              카카오톡으로 문의하기
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
