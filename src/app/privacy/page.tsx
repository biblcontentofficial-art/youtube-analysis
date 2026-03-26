import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - bibl lab",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
        <p className="text-gray-500 text-sm mb-10">최종 수정일: 2026년 3월 19일</p>

        <div className="space-y-10 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제1조 (개인정보의 처리 목적)</h2>
            <p>세모골프(이하 "회사")가 운영하는 bibl lab(이하 "서비스")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법령에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인 식별·인증, 회원자격 유지·관리</li>
              <li>서비스 제공: 유튜브 데이터 분석 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공</li>
              <li>결제 및 환불: 구독 결제 처리, 환불 처리</li>
              <li>고충 처리: 민원 처리, 분쟁 조정을 위한 기록 보존</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제2조 (개인정보의 처리 및 보유 기간)</h2>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>회원 정보: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우 해당 수사·조사 종료 시까지)</li>
              <li>결제 기록: 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 5년 보관</li>
              <li>서비스 이용 기록: 통신비밀보호법에 따라 3개월 보관</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제3조 (처리하는 개인정보의 항목)</h2>
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>필수항목: 이메일 주소, 이름 (Google 계정 연동 시 제공되는 정보)</li>
              <li>서비스 이용 과정에서 자동 생성·수집되는 정보: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
              <li>결제 시 수집 항목: 결제 수단 정보 (카드사명, 카드번호 일부), 결제 내역 (결제 처리는 토스페이먼츠 및 포트원을 통해 이루어지며 회사는 카드 정보 원본을 저장하지 않습니다)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p>회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 관련 법령에서 허용한 경우에만 제3자에게 개인정보를 제공합니다.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border border-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-400 font-medium">수탁사</th>
                    <th className="px-4 py-2 text-left text-gray-400 font-medium">위탁 업무</th>
                    <th className="px-4 py-2 text-left text-gray-400 font-medium">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">토스페이먼츠(주)</td>
                    <td className="px-4 py-2">결제 처리 (정기결제)</td>
                    <td className="px-4 py-2">계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">포트원(주)</td>
                    <td className="px-4 py-2">결제 처리 (간편결제)</td>
                    <td className="px-4 py-2">계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Clerk, Inc.</td>
                    <td className="px-4 py-2">회원 인증·관리</td>
                    <td className="px-4 py-2">계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Vercel, Inc.</td>
                    <td className="px-4 py-2">서버 인프라 운영</td>
                    <td className="px-4 py-2">계약 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제5조 (정보주체의 권리·의무 및 행사 방법)</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
            <p className="mt-3">권리 행사는 bibl.content.official@gmail.com으로 이메일을 통해 요청하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제6조 (개인정보의 파기)</h2>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기술적 방법을 사용하여 복구 불가능하게 삭제합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제7조 (개인정보 보호책임자)</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-1">
              <p><span className="text-gray-400">성명:</span> 김태민</p>
              <p><span className="text-gray-400">직책:</span> 대표</p>
              <p><span className="text-gray-400">이메일:</span> bibl.content.official@gmail.com</p>
              <p><span className="text-gray-400">전화:</span> 070-8027-2532</p>
            </div>
            <p className="mt-3">정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제8조 (쿠키의 운영)</h2>
            <p>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 쿠키(cookie)를 사용합니다. 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용에 일부 제한이 있을 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제9조 (개인정보처리방침 변경)</h2>
            <p>이 개인정보처리방침은 2024년 1월 1일부터 적용됩니다. 내용 추가, 삭제 및 수정이 있을 시에는 변경사항 시행 최소 7일 전부터 서비스 내 공지사항을 통해 고지합니다.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
