/**
 * 약관·개인정보처리방침·환불정책 공용 틀. 문장은 각 페이지에 그대로 두고 모양만 이 틀과 상수로 맞춘다.
 * 근거: DESIGN.md 7.3 '약관·환불·개인정보' (max-w-reading, 본문 text-body leading-[1.75] text-fg-2)
 *
 *   <LegalArticle>
 *     <h1 className={LEGAL_H1}>이용약관</h1>
 *     <p className={LEGAL_META}>최종 수정일: …</p>
 *     <div className={LEGAL_BODY}>
 *       <section className={LEGAL_NOTICE}>YouTube API Services 고지</section>
 *       <section>
 *         <h2 className={LEGAL_H2}>제1조 (목적)</h2>
 *         <ul className={LEGAL_LIST}>…</ul>
 *       </section>
 *     </div>
 *   </LegalArticle>
 *
 * - 넓은 표는 LEGAL_TABLE_WRAP 상자 안에서만 가로로 스크롤한다(페이지는 넘치지 않는다, DESIGN 8 재배치).
 * - 서버 컴포넌트. 상태·데이터 호출 없음(페이지 정적 렌더 유지).
 */
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

/** 문서 제목 */
export const LEGAL_H1 = "text-h3 text-fg md:text-h2";

/** 제목 아래 수정일·시행일 */
export const LEGAL_META = "mt-3 text-caption text-fg-3";

/** 본문 묶음(조항 사이 40px) */
export const LEGAL_BODY = "mt-10 space-y-10 text-body leading-[1.75] text-fg-2 md:mt-12";

/** 조항 제목 */
export const LEGAL_H2 = "mb-3 text-h4 text-fg";

/** 글머리표 목록: 둘째 줄이 글머리표 오른쪽에서 시작한다 */
export const LEGAL_LIST = "list-outside list-disc space-y-2 pl-5";

/** 본문 안 링크(흰 글자 + 밑줄) */
export const LEGAL_LINK =
  "font-medium text-fg underline decoration-fg-4 underline-offset-[3px] wrap-anywhere transition-colors duration-150 hover:decoration-fg";

/** YouTube API Services 고지 상자 */
export const LEGAL_NOTICE = "rounded-card border border-line-strong bg-surface p-5 md:p-6";

/** 사업자 정보·연락처 같은 보조 상자 */
export const LEGAL_BOX = "rounded-card border border-line bg-surface p-5";

/** 표 상자: 좁은 화면에서 표만 가로로 스크롤 */
export const LEGAL_TABLE_WRAP = "overflow-x-auto rounded-card border border-line";

/** 표(13px 이상) */
export const LEGAL_TABLE = "w-full border-collapse text-left text-body-sm leading-[1.6]";

/** 표 머리 칸 */
export const LEGAL_TH = "whitespace-nowrap border-b border-line bg-surface px-4 py-3 text-caption font-semibold text-fg-1";

/** 표 몸통: 마지막 행 아래 선은 상자 테두리와 겹치므로 지운다 */
export const LEGAL_TBODY = "[&>tr:last-child>td]:border-b-0";

/** 표 칸 */
export const LEGAL_TD = "border-b border-line-soft px-4 py-3 align-top";

/** 표 보조 글자(칸 안 둘째 줄) */
export const LEGAL_TD_NOTE = "text-caption font-normal text-fg-3";

export function LegalArticle({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      <Container size="reading" as="article" className="py-16 md:py-24">
        {children}
      </Container>
    </main>
  );
}
