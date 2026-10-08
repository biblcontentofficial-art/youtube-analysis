#!/usr/bin/env python3
"""최종 시안 빌드: 레이아웃 F(fsrc/ 에 F 빌드 결과) + 색 리브랜딩 M(theme-final.css) → ../home.html, ../app.html, ../brand.html

순서
  1) fsrc/_work/build.py 로 F 를 다시 빌드(F 템플릿 그대로, 결과 행 데이터만 복구한 rows.json).
  2) F 의 <style> 에서 @theme 를 theme-final.css 로 바꾸고, 나머지 CSS 의 hex 를 var(--color-*) 로.
  3) 클래스 색을 토큰 유틸리티로(neutral-*·white·black 금지).
  4) M 의 액센트 자리 + 비평 must_fix(로고 판 밝기·크기, ↗ 평소 무채색) 를 넣는다.
  5) brand.skeleton.html → gen_brand.py → brand.html.
  6) 남은 하드코딩 색 검사.
"""
import re, sys, pathlib, subprocess

W = pathlib.Path(__file__).resolve().parent
FINAL = W.parent
FSRC = W / "fsrc"
THEME = (W / "theme-final.css").read_text()
ASSET_FROM = f"file://{FSRC}/assets/"
ASSET_TO = f"file://{FINAL}/assets/"

CSS_SPECIFIC = [
    ("background: #000;\n    color: #fff;", "background: var(--color-canvas);\n    color: var(--color-fg);"),
    ("::selection { background: var(--color-accent); color: #000; }", "::selection { background: var(--color-silver); color: var(--color-accent-ink); }"),
    (".btn-primary { background: #fff; color: #000; }", ".btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }"),
    (".btn-primary:hover { background: #e5e5e5; }", ".btn-primary:hover { background: var(--color-accent-hover); }"),
    (".btn-primary:active { background: #d4d4d4; }", ".btn-primary:active { background: var(--color-accent-active); }"),
    ("letter-spacing: .25em; color: #fff; }", "letter-spacing: .25em; color: var(--color-silver); }"),
    ("vertical-align: -.05em; color: #a1a1a1; }", "vertical-align: -.05em; color: var(--color-fg-3); transition: color .15s ease-out; }\n"
     "  /* 유튜브로 나가는 표시: 평소 무채색, 링크에 올리거나 포커스할 때만 유튜브 빨강 */\n"
     "  a:hover .ext, a:focus-visible .ext { color: var(--color-youtube); }"),
    ('.navlink[aria-current="page"] { color: #fff;', '.navlink[aria-current="page"] { color: var(--color-accent);'),
    ("font-weight: 600; color: #fff; }\n  @media (width >= 48rem) { .tooltab", "font-weight: 600; color: var(--color-accent); }\n  @media (width >= 48rem) { .tooltab"),
    ("border: 1.5px solid #525252;", "border: 1.5px solid var(--color-line-control);"),
    (".chk:hover { border-color: #a1a1a1; }", ".chk:hover { border-color: var(--color-fg-2); }"),
    (".chk:checked, .chk:indeterminate { border-color: #fff; background: #fff; }", ".chk:checked, .chk:indeterminate { border-color: var(--color-accent); background: var(--color-accent); }"),
    ("border-left: 2px solid #000; border-bottom: 2px solid #000;", "border-left: 2px solid var(--color-accent-ink); border-bottom: 2px solid var(--color-accent-ink);"),
    ('.chk:indeterminate::after { content: ""; width: .5rem; height: 2px; background: #000; }', '.chk:indeterminate::after { content: ""; width: .5rem; height: 2px; background: var(--color-accent-ink); }'),
    ("box-shadow: inset 2px 0 0 #fff;", "box-shadow: inset 2px 0 0 var(--color-accent);"),
    ('.seg-item[aria-current="true"] { background: #262626;', '.seg-item[aria-current="true"] { background: var(--color-surface-3);'),
    ("border-block: 1px solid #262626; background: #000;", "border-block: 1px solid var(--color-line); background: var(--color-canvas);"),
    (".td { border-bottom: 1px solid #171717;", ".td { border-bottom: 1px solid var(--color-line-soft);"),
    ("rgb(23 23 23 / .55)", "color-mix(in srgb, var(--color-surface-2) 55%, transparent)"),
    ("rgb(0 0 0 / .8)", "color-mix(in srgb, var(--color-canvas) 80%, transparent)"),
    ("background: #171717; padding: 0; color: #fff; }", "background: var(--color-surface-2); padding: 0; color: var(--color-fg); }"),
]
CSS_GENERIC = [("#fff", "fg"), ("#000", "canvas"), ("#a1a1a1", "fg-3"), ("#d4d4d4", "fg-2"), ("#404040", "line-strong"),
               ("#525252", "line-hover"), ("#262626", "line"), ("#171717", "surface-2"), ("#0a0a0a", "surface"), ("#e5e5e5", "fg-1")]

EXTRA_COMP = """  /* 로고 B 판: 실버 판의 하이라이트 면 위 검정 B (판은 단색. 그라데이션·광택·그림자 없음) */
  .logo-plate { background: var(--color-logo-plate); color: var(--color-accent-ink); }
  /* 정렬 select 펼침 화살표: 토큰 색으로 그리도록 감싼 label 의 ::after (data URI 안에 hex 를 두지 않는다) */
  .select-wrap { position: relative; }
  .select-wrap::after {
    content: ""; position: absolute; right: .625rem; top: 50%; width: 1rem; height: 1rem; margin-top: -.5rem; pointer-events: none;
    background: var(--color-fg-3);
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") center / contain no-repeat;
  }
"""


def convert_style(html: str) -> str:
    m = re.search(r'(<style type="text/tailwindcss">)(.*?)(</style>)', html, re.S)
    css = m.group(2)
    css = re.sub(r"/\*[^*]*토큰은[^*]*\*/\n", "", css)
    css = re.sub(r"@theme \{.*?\n\}\n", lambda _: THEME, css, count=1, flags=re.S)
    head, rest = css.split("@layer base", 1)
    for a, b in CSS_SPECIFIC:
        rest = rest.replace(a, b)
    # select: data URI 화살표 줄을 지우고 select-wrap 으로
    rest = re.sub(r"\n\s*background-image: url\(\"data:image/svg\+xml,[^\n]*\n\s*background-repeat:[^\n]*", "", rest)
    for hx, tok in CSS_GENERIC:
        rest = re.sub(re.escape(hx) + r"(?![0-9a-fA-F])", f"var(--color-{tok})", rest)
    # 주석 속 '에메랄드' 는 흰색으로
    rest = rest.replace("에메랄드 2px 밑줄", "흰 2px 밑줄").replace("+ 에메랄드", "+ 흰")
    rest = re.sub(r"(\n  \.no-scrollbar \{)", "\n" + EXTRA_COMP.rstrip("\n") + r"\1", rest, count=1)
    css = head + "@layer base" + rest
    return html[:m.start(2)] + css + html[m.end(2):]


CLASS_MAP = [
    ("bg-black/80", "bg-canvas/80"), ("bg-black", "bg-canvas"),
    ("focus:bg-white", "focus:bg-accent"), ("focus:text-black", "focus:text-accent-ink"),
    ("text-white", "text-fg"),
    ("border-neutral-900", "border-line-soft"), ("divide-neutral-900", "divide-line-soft"),
    ("border-neutral-800", "border-line"), ("border-neutral-700", "border-line-strong"), ("border-neutral-600", "border-line-hover"),
    ("bg-neutral-950", "bg-surface"), ("bg-neutral-900", "bg-surface-2"), ("bg-neutral-800", "bg-surface-3"), ("bg-neutral-700", "bg-line-strong"),
    ("text-neutral-100", "text-fg-1"), ("text-neutral-200", "text-fg-1"), ("text-neutral-300", "text-fg-2"),
    ("text-neutral-400", "text-fg-3"), ("text-neutral-500", "text-fg-4"), ("text-neutral-600", "text-fg-4"),
    ("decoration-neutral-600", "decoration-fg-4"),
]


def swap_classes(html: str) -> str:
    def fix(m):
        val = m.group(2)
        toks = val.split()
        if "w-px" in toks:  # 세로 구분선은 선 토큰
            val = re.sub(r"(?<![\w:-])bg-neutral-800(?![\w/-])", "bg-line", val)
        for a, b in CLASS_MAP:
            if "/" in a:
                val = val.replace(a, b)
            else:
                val = re.sub(r"(?<![\w-])" + re.escape(a) + r"(?![\w/-])", b, val)
        return m.group(1) + val + m.group(3)
    return re.sub(r'(class=")([^"]*)(")', fix, html)


def must(html, old, new, label, count=1):
    n = html.count(old)
    if n < count:
        sys.exit(f"[build] '{label}' 찾기 실패 (기대 {count}, 실제 {n})")
    return html.replace(old, new)


def common(h):
    h = h.replace(ASSET_FROM, ASSET_TO)
    h = convert_style(h)
    h = swap_classes(h)
    # 로고: 헤더 36px 판(B 22px), 푸터 32px 판. 판 = logo-plate, 'lab' = 실버
    h = re.sub(r'class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-canvas text-lg font-black leading-none">B</span>',
               'class="logo-plate inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[22px] font-black leading-none">B</span>', h)
    h = re.sub(r'class="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-line-strong bg-canvas text-base font-black leading-none">B</span>',
               'class="logo-plate inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] text-[19px] font-black leading-none">B</span>', h)
    h = h.replace('<span class="text-base font-bold tracking-tight">bibl<span class="text-fg-3"> lab</span></span>',
                  '<span class="text-[17px] font-bold tracking-tight">bibl<span class="text-silver"> lab</span></span>')
    h = h.replace('bibl<span class="text-fg-3"> lab</span>', 'bibl<span class="text-silver"> lab</span>')
    h = h.replace('<span class="inline-flex items-center gap-2">\n        <span aria-hidden="true" class="logo-plate inline-flex size-9',
                  '<span class="inline-flex items-center gap-2.5">\n        <span aria-hidden="true" class="logo-plate inline-flex size-9')
    # 카카오 말풍선도 토큰으로
    h = h.replace('fill="#3A1D1D"', 'fill="currentColor"').replace("rounded-full bg-kakao transition-colors", "rounded-full bg-kakao text-kakao-icon transition-colors")
    return h


def build_home():
    h = (FSRC / "home.html").read_text()
    h = re.sub(r"<title>[^<]*</title>", "<title>비블랩 홈 · 최종 시안</title>", h, count=1)
    h = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="bibllab.com 최종 디자인 시안. 레이아웃 F(시안 C 의 언어 + 시안 A 의 유튜브 트렌드 첫 화면)에 색 리브랜딩 M 모노크롬 실버를 입힌 홈.">', h, count=1)
    h = common(h)
    n0 = h.count("logo-plate")
    if n0 < 2:
        sys.exit(f"[build] home 로고 판 {n0}곳")
    # 첫 화면 제목: 맥락은 실버, 핵심어 '유튜브 트렌드'만 흰색(액센트)
    h = must(h, '<h1 id="trend-title" class="text-h2 sm:text-[44px] lg:text-h1 xl:text-display">',
             '<h1 id="trend-title" class="text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display">', "h1")
    # 실적 숫자의 + 는 실버
    for num in ["70만+", "1.7억회+", "10억원+"]:
        h = must(h, f">{num}</dd>", f'>{num[:-1]}<span class="text-silver">+</span></dd>', num)
    h = must(h, '<span aria-hidden="true">7억+</span>', '<span aria-hidden="true">7억<span class="text-silver">+</span></span>', "7억+")
    # 01·02·03 단계 숫자는 섹션 라벨과 같은 실버(라벨의 재질)
    h = re.sub(r'class="tnum pt-0\.5 text-body-sm font-bold text-fg-3 sm:block sm:pt-0">(0[123])<',
               r'class="tnum pt-0.5 text-body-sm font-bold text-silver sm:block sm:pt-0">\1<', h)
    # 미리보기 속 현재 탭 글자도 액센트 토큰으로(값은 같은 흰색, 뜻을 맞춤)
    h = h.replace('border-b-2 border-accent font-semibold text-fg">영상 찾기', 'border-b-2 border-accent font-semibold text-accent">영상 찾기')
    h = h.replace("에메랄드는 '지금 보는 자리'에만", "흰색 액센트는 '지금 보는 자리'에만")
    (FINAL / "home.html").write_text(h)
    return h


def build_app():
    a = (FSRC / "app.html").read_text()
    a = re.sub(r"<title>[^<]*</title>", "<title>영상 찾기 · 최종 시안</title>", a, count=1)
    a = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="bibllab.com 최종 디자인 시안(모노크롬 실버). 로그인 후 영상 찾기 결과 화면, Starter 계정 예시 화면·조회수 순 정렬·2개 선택한 상태.">', a, count=1)
    a = common(a)
    a = must(a, '<label class="flex items-center"><span class="sr-only">정렬</span>', '<label class="select-wrap flex items-center"><span class="sr-only">정렬</span>', "select-wrap")
    a = a.replace("R04 TAB(현재 탭 흰 글자 + 에메랄드 밑줄)", "R04 TAB(현재 탭 흰 글자 + 흰 밑줄 2px)")
    (FINAL / "app.html").write_text(a)
    return a


def build_brand():
    subprocess.run([sys.executable, str(W / "gen_brand.py")], check=True)
    b = (W / "brand.template.html").read_text().replace("/*THEME*/", THEME)
    (FINAL / "brand.html").write_text(b)
    return b


def check(name, html, allow_inline=False):
    st = re.search(r'<style type="text/tailwindcss">(.*?)</style>', html, re.S)
    css, body = st.group(1), html[st.end():]
    bad = []
    for pat in [r"\bneutral-\d", r"\b(?:bg|text|border|divide|ring|outline|fill|stroke|decoration|accent)-(?:black|white|gray|slate|zinc|stone|red|green|blue|emerald|teal|amber|yellow|orange|sky|cyan)\b",
                r"\[#[0-9a-fA-F]{3,8}\]", r"\b(?:fill|stroke|stop-color|color)=\"#[0-9a-fA-F]{3,8}\""]:
        bad += [m.group(0) for m in re.finditer(pat, body)]
    inline = re.findall(r'style="[^"]*#[0-9a-fA-F]{3,8}[^"]*"', body)
    after = css.split("@layer base", 1)[1]
    css_hex = re.findall(r"#[0-9a-fA-F]{3,8}\b", after)
    banned = re.findall(r"gradient|blur\(|drop-shadow|animate-pulse|animate-ping|text-shadow|—", html)
    ok = not bad and not css_hex and (allow_inline or not inline) and not banned
    print(f"[check] {name}: 하드코딩 클래스 {len(bad)} {sorted(set(bad))[:8]} · 인라인 hex {len(inline)} · CSS hex {len(css_hex)} {sorted(set(css_hex))} · 금지 패턴 {sorted(set(banned))} → {'OK' if ok else '확인 필요'}")
    return ok


if __name__ == "__main__":
    subprocess.run([sys.executable, str(FSRC / "_work" / "build.py")], check=True, stdout=subprocess.DEVNULL)
    ok = check("home", build_home())
    ok &= check("app", build_app())
    ok &= check("brand", build_brand(), allow_inline=True)
    sys.exit(0 if ok else 1)
