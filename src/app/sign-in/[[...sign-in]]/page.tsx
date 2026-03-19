const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";

export default async function SignInPage() {
  if (hasClerk) {
    const { SignIn } = await import("@clerk/nextjs");
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <SignIn />
      </main>
    );
  }

  // Clerk 미설정 시 안내 UI
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">bibl</span>
            <span className="text-teal-400"> lab</span>
          </span>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">로그인</h1>
        <p className="text-gray-400 text-sm mb-8">
          Google 계정으로 간편하게 시작하세요
        </p>

        {/* Gmail 로그인 버튼 */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition opacity-60 cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>

        <p className="mt-4 text-xs text-gray-600">
          서비스 준비 중입니다. 곧 오픈됩니다.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-600 mb-3">개발자 설정 안내</p>
          <div className="bg-gray-950 rounded-lg p-3 text-left text-xs font-mono text-gray-500 space-y-1">
            <p className="text-teal-500"># .env.local에 추가</p>
            <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...</p>
            <p>CLERK_SECRET_KEY=sk_live_...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
