import type { Metadata } from "next";
import SignInForm from "../_components/SignInForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

export default function SignInPage() {
  if (hasClerk) {
    return <SignInForm />;
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <h1 className="text-xl font-bold text-white mb-2">로그인</h1>
        <p className="text-gray-400 text-sm mb-8">소셜 계정으로 간편하게 시작하세요</p>
        <button disabled className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-bold py-3 px-4 rounded-xl opacity-60 cursor-not-allowed mb-3">
          카카오로 계속하기
        </button>
        <button disabled className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl opacity-60 cursor-not-allowed">
          Google로 계속하기
        </button>
        <p className="mt-4 text-xs text-gray-600">서비스 준비 중입니다.</p>
      </div>
    </main>
  );
}
