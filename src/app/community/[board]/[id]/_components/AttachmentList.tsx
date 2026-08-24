/**
 * 첨부파일 목록 (서버 컴포넌트)
 * 이미지도 썸네일을 만들지 않고 파일 아이콘으로 통일한다 (원격 이미지 CSP 이슈 회피).
 */

import { formatFileSize, type Attachment } from "@/lib/community";

interface Props {
  attachments: Attachment[];
}

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <section className="pb-8">
      <h2 className="text-xs font-bold tracking-tight text-neutral-500 mb-3">
        첨부파일 {attachments.length}
      </h2>
      <ul className="rounded-2xl border border-neutral-800 bg-neutral-900 divide-y divide-white/[0.06] overflow-hidden">
        {attachments.map((f) => (
          <li key={f.id}>
            <a
              href={`/api/community/download/${f.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0 text-neutral-500" aria-hidden="true">
                <path
                  d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="min-w-0 flex-1">
                <span className="block text-sm text-neutral-200 truncate">{f.file_name}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">
                  {formatFileSize(f.file_size)}
                  <span aria-hidden="true"> · </span>
                  다운로드 {f.download_count.toLocaleString()}
                </span>
              </span>

              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-neutral-500" aria-hidden="true">
                <path
                  d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
