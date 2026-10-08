/**
 * 대화상자 안쪽 모양(제목·설명·버튼 줄). 서버·클라이언트 공용이라 "use client" 를 두지 않는다.
 * dialog.tsx 는 클라이언트 모듈이어서, 거기서 내보낸 상수를 서버 컴포넌트가 가져오면 문자열 대신 클라이언트 참조를 받는다.
 *
 *   <Dialog open={open} onClose={close} labelledBy={titleId}>
 *     <h2 id={titleId} className={DIALOG_TITLE}>제목</h2>
 *     <p className={DIALOG_DESCRIPTION}>설명</p>
 *     <div className={DIALOG_ACTIONS}>버튼들</div>
 *   </Dialog>
 */

export const DIALOG_TITLE = "text-body font-semibold text-fg";
export const DIALOG_DESCRIPTION = "mt-2 text-body-sm text-fg-3";
export const DIALOG_ACTIONS = "mt-6 flex justify-end gap-2";
