export const metadata = {
  title: "시스템 점검 중 | bibl lab",
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          시스템 점검 중입니다
        </h1>
        <p className="text-gray-400 mb-6 leading-relaxed">
          더 나은 서비스를 위해 시스템 점검을 진행하고 있습니다.
          <br />
          빠르게 복구하겠습니다. 잠시만 기다려주세요.
        </p>
        <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-500">
          <p>문의: bibl.content.official@gmail.com</p>
        </div>
      </div>
    </main>
  );
}
