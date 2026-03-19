import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환불정책 - bibl lab",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">환불정책</h1>
        <p className="text-gray-500 text-sm mb-10">최종 수정일: 2026년 3월 19일</p>

        <div className="space-y-10 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">구독 취소 및 환불 원칙</h2>
            <p>bibl lab은 월 구독 서비스를 제공합니다. 전자상거래 등에서의 소비자 보호에 관한 법률 및 콘텐츠산업 진흥법에 따라 다음과 같은 환불 정책을 운영합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">구독 취소</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>구독은 언제든지 취소할 수 있습니다.</li>
              <li>취소 후에도 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할 수 있습니다.</li>
              <li>다음 결제일 이후에는 자동 갱신이 중단되며, 요금이 청구되지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">환불 기준</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-gray-300 font-medium">구분</th>
                    <th className="px-5 py-3 text-left text-gray-300 font-medium">환불 기준</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-5 py-4 font-medium text-gray-300">결제 후 7일 이내<br /><span className="text-xs text-gray-500 font-normal">서비스 미이용 시</span></td>
                    <td className="px-5 py-4">전액 환불</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium text-gray-300">결제 후 7일 이내<br /><span className="text-xs text-gray-500 font-normal">서비스 이용 후</span></td>
                    <td className="px-5 py-4">사용 기간 공제 후 잔여 금액 환불<br /><span className="text-xs text-gray-500">잔여 금액 = 결제 금액 × (잔여 일수 / 30일)</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium text-gray-300">결제 후 7일 초과</td>
                    <td className="px-5 py-4">원칙적으로 환불 불가<br /><span className="text-xs text-gray-500">단, 회사 귀책사유로 인한 서비스 장애는 예외 적용</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-medium text-gray-300">회사 귀책사유<br /><span className="text-xs text-gray-500 font-normal">서비스 장애·오류 등</span></td>
                    <td className="px-5 py-4">장애 기간에 해당하는 금액 전액 환불</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">환불 신청 방법</h2>
            <p>환불은 아래 방법으로 신청할 수 있습니다.</p>
            <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-teal-400">✓</span>
                이메일: <a href="mailto:bibl.content.official@gmail.com" className="text-teal-400 hover:underline">bibl.content.official@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-teal-400">✓</span>
                전화: 070-8027-2532 (평일 10:00~18:00)
              </p>
            </div>
            <p className="mt-3">환불 신청 시 <span className="text-white font-medium">가입 이메일, 구독 플랜, 환불 사유</span>를 함께 알려주시면 빠른 처리가 가능합니다.</p>
            <p className="mt-2">환불 처리는 영업일 기준 3~5일 이내에 완료되며, 카드 결제 취소 후 카드사 정책에 따라 실제 환불까지 추가 영업일이 소요될 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">청약철회 제한</h2>
            <p>다음의 경우 콘텐츠산업 진흥법 제27조 및 전자상거래 등에서의 소비자보호에 관한 법률 제17조에 따라 청약철회가 제한될 수 있습니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>이용자가 제공받은 디지털 콘텐츠(검색 결과, 분석 데이터 등)를 상당 부분 사용한 경우</li>
              <li>청약철회가 불가능한 사유를 고지하고 동의를 받은 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">소비자 피해 구제</h2>
            <p>본 환불정책과 관련하여 분쟁이 발생한 경우, 다음 기관에 도움을 요청하실 수 있습니다.</p>
            <ul className="list-disc list-inside mt-3 space-y-1 pl-2">
              <li>한국소비자원 (국번없이 1372)</li>
              <li>전자거래분쟁조정위원회 (www.ecmc.or.kr)</li>
              <li>공정거래위원회 소비자 상담센터 (국번없이 1372)</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
