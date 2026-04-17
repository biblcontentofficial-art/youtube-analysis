import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "비블랩(bibl lab) 서비스 이용약관. 회원가입, 서비스 이용, 결제, 환불 등에 관한 권리와 의무를 안내합니다.",
  alternates: { canonical: "https://bibllab.com/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">이용약관</h1>
        <p className="text-gray-500 text-sm mb-10">최종 수정일: 2026년 3월 19일 &nbsp;|&nbsp; 시행일: 2026년 3월 19일</p>

        <div className="space-y-10 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제1조 (목적)</h2>
            <p>이 약관은 세모골프(이하 "회사")가 운영하는 bibl lab 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>"서비스"란 회사가 제공하는 유튜브 데이터 분석 및 관련 부가 서비스를 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
              <li>"회원"이란 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회원 자격을 부여받은 자를 말합니다.</li>
              <li>"유료회원"이란 월정액 구독 서비스(Starter, Pro, Business)를 구독한 회원을 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제3조 (약관의 효력 및 변경)</h2>
            <p>이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 서비스 내 공지합니다. 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제4조 (서비스 제공)</h2>
            <p>회사는 다음과 같은 서비스를 제공합니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>유튜브 키워드 검색 및 영상 분석</li>
              <li>아웃라이어 점수 및 반응도 분석</li>
              <li>알고리즘 확률 분석</li>
              <li>검색 기록 저장 및 관리</li>
              <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴 계약 등을 통해 이용자에게 제공하는 일체의 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제5조 (구독 및 결제)</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>유료 서비스는 월 단위로 자동 갱신되는 구독 방식으로 제공됩니다.</li>
              <li>구독료는 구독 시작일로부터 매월 동일한 날짜에 자동 결제됩니다.</li>
              <li>결제 수단은 신용카드/체크카드를 지원합니다.</li>
              <li>구독 요금은 다음과 같습니다: Starter ₩29,000/월, Pro ₩49,000/월, Team bibl ₩310,000/월 (연간 기준)</li>
              <li>결제는 토스페이먼츠 및 포트원을 통해 안전하게 처리됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>신청 또는 변경 시 허위 내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지식재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제·유통·조장하거나 상업적으로 이용하는 행위</li>
              <li>크롤링, 스크래핑 등 자동화된 방법으로 서비스를 이용하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제7조 (서비스 이용 제한)</h2>
            <p>회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고·일시정지·영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다. 회사는 전항에도 불구하고 주민등록법을 위반한 명의도용 및 결제도용, 저작권법 위반, 음란물 유포 등 관련 법령을 위반한 경우에는 즉시 영구이용정지를 할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제8조 (책임 제한)</h2>
            <p>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대해서는 책임을 지지 않습니다. 유튜브 API 정책 변경 또는 서비스 중단으로 인해 발생하는 데이터 불일치에 대해 회사는 책임을 지지 않습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제9조 (분쟁 해결)</h2>
            <p>이 약관은 대한민국 법률에 따라 규율되고 해석됩니다. 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우, 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">부칙</h2>
            <p>이 약관은 2024년 1월 1일부터 시행됩니다.</p>
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-1 text-xs">
              <p className="font-medium text-gray-300">사업자 정보</p>
              <p>상호: 세모골프 &nbsp;|&nbsp; 대표자: 김태민</p>
              <p>사업자등록번호: 315-47-01018</p>
              <p>통신판매업신고번호: 2023-수원권선-1549</p>
              <p>주소: 경기도 수원시 권선구 세화로 151번길 29-2 1층</p>
              <p>이메일: bibl.content.official@gmail.com &nbsp;|&nbsp; 전화: 070-8027-2532</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
