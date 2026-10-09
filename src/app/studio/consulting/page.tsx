import ConsultingForm from "./_components/ConsultingForm";

/**
 * 채널 대행 상담 신청 (/studio/consulting).
 * 서버 컴포넌트로 두어 폼 본체를 정적 프리렌더한다. 주소 쿼리(키워드 컨설팅 요청)는
 * ConsultingForm 이 마운트 뒤 window.location 에서 읽는다(Suspense·useSearchParams 를 쓰지 않는다).
 */
export default function ConsultingPage() {
  return <ConsultingForm />;
}
