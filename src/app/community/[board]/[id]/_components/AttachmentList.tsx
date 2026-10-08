/**
 * 첨부파일 표시 (서버 컴포넌트)
 * 사진·영상은 글 본문 아래에 바로 그리고(/api/community/media), 그 외 파일만 다운로드 목록으로 붙인다.
 * 사진·영상 높이 상한은 본문 렌더러(PostContent)와 같다(70vh). 다운로드 링크에는 download 속성을 둔다.
 */

import { formatFileSize, mediaKind, type Attachment } from "@/lib/community";

interface Props {
  attachments: Attachment[];
}

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null;

  const media = attachments.filter((f) => mediaKind(f.file_name) !== "file");
  const files = attachments.filter((f) => mediaKind(f.file_name) === "file");

  return (
    <>
      {/* 사진·영상 — 글에서 바로 보인다 */}
      {media.length > 0 && (
        <section className="space-y-6 pb-8">
          {media.map((f) => (
            <figure key={f.id}>
              {mediaKind(f.file_name) === "video" ? (
                <video
                  src={`/api/community/media/${f.id}`}
                  controls
                  playsInline
                  preload="metadata"
                  className="mx-auto block w-auto max-w-full max-h-[70vh] rounded-panel border border-line bg-canvas"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/community/media/${f.id}`}
                  alt={f.file_name}
                  loading="lazy"
                  className="mx-auto block h-auto w-auto max-w-full max-h-[70vh] rounded-panel border border-line"
                />
              )}
              <figcaption className="mt-2 flex items-center gap-2 text-caption text-fg-3">
                <span className="min-w-0 truncate">{f.file_name}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{formatFileSize(f.file_size)}</span>
                <a
                  href={`/api/community/download/${f.id}`}
                  download
                  className="-my-3 ml-auto inline-flex h-11 shrink-0 items-center font-medium text-fg-2 transition-colors hover:text-fg"
                >
                  원본 저장
                </a>
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {/* 그 외 파일 — 다운로드 목록 */}
      {files.length > 0 && (
        <section className="pb-8">
          <h2 className="mb-3 text-caption font-semibold text-fg-3">
            첨부파일 {files.length}
          </h2>
          <ul className="divide-y divide-line-soft overflow-hidden rounded-card border border-line bg-surface">
            {files.map((f) => (
              <li key={f.id}>
                <a
                  href={`/api/community/download/${f.id}`}
                  download
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-fg-3" aria-hidden="true">
                    <path
                      d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm text-fg-1">{f.file_name}</span>
                    <span className="mt-0.5 block text-caption text-fg-3">
                      {formatFileSize(f.file_size)}
                      <span aria-hidden="true"> · </span>
                      다운로드 {f.download_count.toLocaleString()}
                    </span>
                  </span>

                  <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-fg-3" aria-hidden="true">
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
      )}
    </>
  );
}
