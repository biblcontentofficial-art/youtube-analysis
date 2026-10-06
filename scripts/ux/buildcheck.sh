#!/bin/zsh
# 개발 서버의 .next 를 건드리지 않고, 현재 작업 트리를 별도 폴더로 복사해 next build 한다.
# 렌더 방식(○ 정적 · ● ISR · ƒ 동적)을 scripts/ux/routes.baseline.txt 와 비교해 바뀐 라우트를 알려 준다.
#
#   scripts/ux/buildcheck.sh                 빌드 + 비교 (끝 줄: BUILD_OK / BUILD_FAILED / ROUTES_CHANGED)
#   UX_BUILD_DIR=/path scripts/ux/buildcheck.sh   빌드 폴더 지정 (기본 $TMPDIR/bibllab-buildwt)
#   scripts/ux/buildcheck.sh --write-baseline     현재 렌더 방식을 기준으로 저장 (의도한 변경일 때만)
REPO="${0:A:h:h:h}"
B="${UX_BUILD_DIR:-${TMPDIR:-/tmp}/bibllab-buildwt}"
mkdir -p "$B"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude .vercel --exclude '.env*' \
  --exclude 'src/app/ux-preview' \
  --exclude 'public/week*-images' --exclude 'public/wk*-images' --exclude 'public/longform-images' \
  --exclude 'public/views-law-images' --exclude 'public/yt3books-images' \
  "$REPO/" "$B/"
ln -sfn "$REPO/node_modules" "$B/node_modules"
for f in "$REPO"/.env*(N); do ln -sfn "$f" "$B/${f:t}"; done
cd "$B" || exit 1
LOG="$B/build.log"
if ! npx next build > "$LOG" 2>&1; then
  grep -iE "error|failed|Type error|Module not found" -A4 "$LOG" | head -60
  echo "BUILD_FAILED (log: $LOG)"; exit 1
fi
python3 "$REPO/scripts/ux/parse-routes.py" "$LOG" > "$B/routes.txt"
echo "routes: $(wc -l < "$B/routes.txt" | tr -d ' ') (○ $(grep -c '^○' "$B/routes.txt") · ● $(grep -c '^●' "$B/routes.txt") · ƒ $(grep -c '^ƒ' "$B/routes.txt"))"
grep -iE "warn" "$LOG" | head -10
BASE="$REPO/scripts/ux/routes.baseline.txt"
if [[ "$1" == "--write-baseline" ]]; then cp "$B/routes.txt" "$BASE"; echo "기준 저장: $BASE"; echo BUILD_OK; exit 0; fi
if [[ -f "$BASE" ]]; then
  DIFF=$(python3 - "$BASE" "$B/routes.txt" <<'PY'
import sys
def load(p): return {l.split()[1]: l.split()[0] for l in open(p) if len(l.split()) >= 2}
a, b = load(sys.argv[1]), load(sys.argv[2])
for r in sorted(set(a) | set(b)):
    if r.startswith("/api/"): continue
    if a.get(r) != b.get(r): print(f"  {r}: {a.get(r, '없음')} → {b.get(r, '없음')}")
PY
)
  if [[ -n "$DIFF" ]]; then echo "렌더 방식이 바뀐 라우트:"; echo "$DIFF"; echo ROUTES_CHANGED; exit 2; fi
fi
echo BUILD_OK
