#!/usr/bin/env python3
"""F 원본(_orig) → 팔레트 M 화면(home.html, app.html) + brand.template.html → brand.html.

- 공통 토큰은 theme-m.css 한 곳. 세 파일에 똑같이 넣는다.
- 클래스 색은 토큰 유틸리티로 바꾸고(neutral-*, white, black 금지), CSS 의 hex 는 var(--color-*) 로 바꾼다.
- 끝에 남은 하드코딩 색을 검사한다.
"""
import re, sys, pathlib

M = pathlib.Path(__file__).resolve().parent.parent
ORIG, WORK = M / "_orig", M / "_work"
THEME = (WORK / "theme-m.css").read_text()

BASE = """@layer base {
  html {
    background: var(--color-canvas);
    color: var(--color-fg);
    color-scheme: dark;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  h1, h2, h3, h4 { text-wrap: balance; }
  p, li, dd, figcaption { text-wrap: pretty; }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  ::selection { background: var(--color-silver); color: var(--color-accent-ink); }
  summary { list-style: none; }
  summary::-webkit-details-marker { display: none; }
  img { color: transparent; }
  input[type="search"]::-webkit-search-cancel-button { display: none; }
}"""

COMMON = """  .tnum { font-variant-numeric: tabular-nums; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: %(gap)s;
    white-space: nowrap; border-radius: var(--radius-control); font-weight: 700;
    transition: background-color .15s ease-out, border-color .15s ease-out, color .15s ease-out;
  }
  /* 주 버튼: 폴리시드 화이트 → hover 한 단 → 누르면 실버 판 */
  .btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }
  .btn-primary:hover { background: var(--color-accent-hover); }
  .btn-primary:active { background: var(--color-accent-active); }
  .btn-secondary { border: 1px solid var(--color-line-strong); background: var(--color-surface); color: var(--color-fg); font-weight: 600; }
  .btn-secondary:hover { border-color: var(--color-line-hover); background: var(--color-surface-2); }
  /* 로고 B 마크: 실버 판(실버 플레이 버튼의 판) 위에 검정 B */
  .logo-plate { background: var(--color-silver); color: var(--color-accent-ink); }
  .no-scrollbar { scrollbar-width: none; }
  .no-scrollbar::-webkit-scrollbar { display: none; }"""

HOME_COMP = """@layer components {
%(common)s
  .navlink {
    display: inline-flex; height: 2.25rem; align-items: center; border-radius: var(--radius-control);
    padding-inline: .75rem; font-size: .875rem; font-weight: 500; color: var(--color-fg-3); transition: color .15s ease-out;
  }
  .navlink:hover { color: var(--color-fg); }
  .navlink.is-strong { color: var(--color-fg); font-weight: 600; }
  .sec-head {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    border-bottom: 1px solid var(--color-line); padding-bottom: 1rem;
  }
  .sec-head__caption { font-size: .8125rem; color: var(--color-fg-3); }
  /* 섹션 라벨은 실버(액센트 자리) */
  .sec-head__label { font-size: .8125rem; font-weight: 900; letter-spacing: .25em; color: var(--color-silver); }
  @media (width >= 48rem) {
    .sec-head__caption { font-size: .875rem; }
    .sec-head__label { font-size: .875rem; }
  }
  .card {
    position: relative; display: flex; flex-direction: column; overflow: hidden;
    border: 1px solid var(--color-line); border-radius: var(--radius-media); background: var(--color-surface);
    transition: border-color .15s ease-out;
  }
  .card:hover { border-color: var(--color-line-hover); }
  .card-link::after { content: ""; position: absolute; inset: 0; }
  .chip {
    display: inline-flex; height: 2.5rem; flex-shrink: 0; align-items: center; border-radius: var(--radius-control);
    border: 1px solid var(--color-line); padding-inline: .75rem; font-size: .8125rem; color: var(--color-fg-2);
    transition: border-color .15s ease-out, color .15s ease-out;
  }
  .chip:hover { border-color: var(--color-line-hover); color: var(--color-fg); }
  @media (width >= 40rem) { .chip { height: 2.25rem; padding-inline: .625rem; } }
  /* 유튜브로 나가는 링크 표시: 유튜브 빨강은 이 자리에만 */
  .ext { display: inline-block; width: .8em; height: .8em; vertical-align: -.05em; color: var(--color-youtube); }
}"""

APP_COMP = """@layer components {
%(common)s
  .btn-ghost { color: var(--color-fg-2); font-weight: 600; }
  .btn-ghost:hover { background: var(--color-surface-2); color: var(--color-fg); }
  /* 잠긴 기능(요금제 필요): 라벨을 한 단 낮추고 'Pro' 표시는 한 모양(무채색, 액센트 아님) */
  .is-locked { color: var(--color-fg-3); }
  .pro { display: inline-flex; align-items: center; border: 1px solid var(--color-line-strong); border-radius: .25rem; padding-inline: .25rem; font-size: .75rem; line-height: 1.125rem; font-weight: 500; color: var(--color-fg-3); }
  /* 앱 셸 네비: 여섯 곳 모두 같은 회색 글자, 현재 위치만 흰 글자(액센트) */
  .navlink {
    display: inline-flex; height: 2.25rem; align-items: center; gap: .25rem; border-radius: var(--radius-control);
    padding-inline: .75rem; font-size: .875rem; font-weight: 500; color: var(--color-fg-3); transition: color .15s ease-out;
  }
  .navlink:hover, details[open] > .navlink { color: var(--color-fg); }
  .navlink[aria-current="page"] { color: var(--color-accent); font-weight: 600; }
  .tab { display: inline-flex; height: 2rem; align-items: center; justify-content: center; border-radius: .375rem; padding-inline: .75rem; font-size: .8125rem; font-weight: 500; color: var(--color-fg-3); transition: color .15s, background-color .15s; }
  .tab:hover { color: var(--color-fg); }
  .tab[aria-current="true"] { background: var(--color-surface-3); color: var(--color-fg); font-weight: 600; }
  .th-sort { display: inline-flex; align-items: center; gap: .25rem; border-radius: .25rem; color: inherit; }
  .th-sort:hover { color: var(--color-fg); }
  .chk {
    appearance: none; display: inline-grid; place-content: center; width: 1.125rem; height: 1.125rem; margin: 0;
    border: 1.5px solid var(--color-line-control); border-radius: .25rem; background: transparent; cursor: pointer;
    transition: border-color .15s ease-out, background-color .15s ease-out;
  }
  .chk:hover { border-color: var(--color-fg-2); }
  .chk:checked, .chk:indeterminate { border-color: var(--color-accent); background: var(--color-accent); }
  .chk:checked::after {
    content: ""; width: .55rem; height: .3rem; border-left: 2px solid var(--color-accent-ink); border-bottom: 2px solid var(--color-accent-ink);
    transform: translateY(-1px) rotate(-45deg);
  }
  .chk:indeterminate::after { content: ""; width: .5rem; height: 2px; background: var(--color-accent-ink); }
  /* 결과 행: hover 는 그래파이트 반 단, 선택은 그래파이트 한 단 + 왼쪽 흰 막대(액센트) */
  .row { transition: background-color .15s ease-out; }
  .row:hover { background: color-mix(in srgb, var(--color-surface-2) 55%%, transparent); }
  .row.is-selected { background: var(--color-surface-2); }
  tr.row.is-selected > td:first-child, li.row.is-selected { box-shadow: inset 2px 0 0 var(--color-accent); }
  .select {
    appearance: none; height: 2.75rem; border: 1px solid var(--color-line); border-radius: var(--radius-control); background: var(--color-surface);
    padding: 0 2.25rem 0 .75rem; font-size: .875rem; color: var(--color-fg);
  }
  /* 펼침 화살표는 토큰 색을 쓰도록 감싼 label 의 ::after 로 그린다(data URI 안 hex 를 두지 않는다) */
  .select-wrap { position: relative; }
  .select-wrap::after {
    content: ""; position: absolute; right: .625rem; top: 50%%; width: 1rem; height: 1rem; margin-top: -.5rem; pointer-events: none;
    background: var(--color-fg-3);
    -webkit-mask: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%%3E%%3Cpath d='m6 9 6 6 6-6'/%%3E%%3C/svg%%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%%3E%%3Cpath d='m6 9 6 6 6-6'/%%3E%%3C/svg%%3E") center / contain no-repeat;
  }
}
/* 하단 고정 바가 보이는 768px 미만: 카카오 버튼을 바 위로 (실제 globals.css 의 [data-bottom-bar="md"] 규칙과 같은 값) */
@media (width < 48rem) {
  body:has([data-bottom-bar="md"]:not([hidden])) [data-kakao-fab] { bottom: calc(88px + env(safe-area-inset-bottom)); }
}"""

# 클래스 색 → 토큰 (앞 접두사 hover:, focus:, lg: 등은 그대로 둔다)
CLASS_MAP = [
    ("bg-black/80", "bg-canvas/80"),
    ("bg-black", "bg-canvas"),
    ("focus:bg-white", "focus:bg-accent"),
    ("focus:text-black", "focus:text-accent-ink"),
    ("border-white", "border-accent"),
    ("text-white", "text-fg"),
    ("border-neutral-900", "border-line-soft"),
    ("divide-neutral-900", "divide-line-soft"),
    ("border-neutral-800", "border-line"),
    ("border-neutral-700", "border-line-strong"),
    ("border-neutral-600", "border-line-hover"),
    ("bg-neutral-950", "bg-surface"),
    ("bg-neutral-900", "bg-surface-2"),
    ("w-px bg-neutral-800", "w-px bg-line"),
    ("bg-neutral-800", "bg-surface-3"),
    ("text-neutral-100", "text-fg-1"),
    ("text-neutral-200", "text-fg-1"),
    ("text-neutral-300", "text-fg-2"),
    ("text-neutral-400", "text-fg-3"),
    ("text-neutral-500", "text-fg-4"),
    ("text-neutral-600", "text-fg-4"),
    ("decoration-neutral-600", "decoration-fg-4"),
]


def swap_classes(html: str) -> str:
    def fix_attr(m):
        val = m.group(2)
        for a, b in CLASS_MAP:
            val = re.sub(r"(?<![\w-])" + re.escape(a) + r"(?![\w/-])", b, val) if "/" not in a else val.replace(a, b)
        return m.group(1) + val + m.group(3)
    return re.sub(r'(class=")([^"]*)(")', fix_attr, html)


def replace_style(html: str, comp: str, gap: str) -> str:
    style = "<style type=\"text/tailwindcss\">\n" + THEME + BASE + "\n" + (comp % {"common": COMMON % {"gap": gap}}) + "\n</style>"
    return re.sub(r'<style type="text/tailwindcss">.*?</style>', lambda _: style, html, count=1, flags=re.S)


def must_sub(html, old, new, count=1, label=""):
    n = html.count(old)
    if n < count:
        sys.exit(f"[build] '{label or old[:60]}' 찾기 실패 (기대 {count}, 실제 {n})")
    return html.replace(old, new)


def logo(html):
    # 헤더(size-8)·푸터(size-7) B 마크: 테두리 → 실버 판, 'lab' 은 실버
    html = re.sub(r'rounded-(lg|md) border border-line-strong (text-(?:lg|base) font-black leading-none)">B</span>',
                  r'rounded-\1 logo-plate \2">B</span>', html)
    html = html.replace('bibl<span class="text-fg-3"> lab</span>', 'bibl<span class="text-silver"> lab</span>')
    return html


def build_home():
    h = (ORIG / "home.html").read_text()
    h = h.replace("<title>비블랩 홈 · 최종 시안 F</title>", "<title>비블랩 홈 · 색 시안 M</title>")
    h = h.replace('content="bibllab.com 최종 디자인 시안. 시안 C(크리에이터 브랜드)의 언어 위에 시안 A 의 유튜브 트렌드 첫 화면을 얹은 홈."',
                  'content="bibllab.com 색 리브랜딩 시안 M 모노크롬 실버. 최종 시안 F 의 레이아웃에 검정·그래파이트·실버만 쓴 홈."')
    h = h.replace("/scratchpad/mockups/F/assets/", "/scratchpad/mockups/palette/M/assets/")  # F 자산은 시작 시점 사본을 쓴다
    h = replace_style(h, HOME_COMP, ".5rem")
    h = swap_classes(h)
    h = logo(h)
    # 첫 화면 제목: 맥락은 실버, 핵심어 '유튜브 트렌드'만 폴리시드 화이트(액센트)
    h = must_sub(h, 'class="text-[clamp(36px,4.45vw,64px)] font-extrabold leading-[1.16] tracking-[-0.025em]"',
                 'class="text-[clamp(36px,4.45vw,64px)] font-extrabold leading-[1.16] tracking-[-0.025em] text-silver"', label="h1")
    # 실적 숫자의 + 는 실버(성과의 재질). 숫자 자체는 흰색
    for num in ["70만+", "1.7억회+", "10억원+"]:
        h = must_sub(h, f'>{num}</dd>', f'>{num[:-1]}<span class="text-silver">+</span></dd>', label=num)
    h = must_sub(h, '<span aria-hidden="true">7억+</span>', '<span aria-hidden="true">7억<span class="text-silver">+</span></span>', label="7억+")
    # 미리보기 속 앱 상태 표시: 현재 탭 막대·정렬 열은 액센트
    h = must_sub(h, 'border-b-2 border-accent font-semibold text-fg">영상 찾기', 'border-b-2 border-accent font-semibold text-accent">영상 찾기', label="preview tab")
    h = must_sub(h, 'text-right font-semibold text-fg">조회수 ↓', 'text-right font-semibold text-accent">조회수 ↓', label="preview sort")
    # 카카오 말풍선 글자색도 토큰으로
    h = h.replace('fill="#3A1D1D"', 'fill="currentColor"').replace('bg-kakao transition-colors', 'bg-kakao text-kakao-icon transition-colors')
    (M / "home.html").write_text(h)
    return h


def build_app():
    a = (ORIG / "app.html").read_text()
    a = a.replace("<title>영상 찾기 · 최종 시안 F</title>", "<title>영상 찾기 · 색 시안 M</title>")
    a = a.replace('content="bibllab.com 최종 디자인 시안. 로그인 후 영상 찾기 결과 화면(예시 화면, 2개 선택한 상태)."',
                  'content="bibllab.com 색 리브랜딩 시안 M 모노크롬 실버. 로그인 후 영상 찾기 결과 화면(예시 화면, 2개 선택한 상태)."')
    a = replace_style(a, APP_COMP, ".375rem")
    a = swap_classes(a)
    a = logo(a)
    # 도구 탭 현재 위치·정렬 열은 액센트
    a = must_sub(a, 'border-b-2 border-accent text-sm font-semibold text-fg">영상 찾기', 'border-b-2 border-accent text-sm font-semibold text-accent">영상 찾기', label="tool tab")
    a = must_sub(a, 'text-right font-medium text-fg" aria-sort="descending"', 'text-right font-medium text-accent" aria-sort="descending"', label="sort th")
    # 정렬 select: 화살표를 토큰 색으로 그리는 감싸개
    a = must_sub(a, '<label class="flex items-center gap-2"><span class="sr-only">정렬</span>', '<label class="select-wrap flex items-center gap-2"><span class="sr-only">정렬</span>', label="select wrap")
    a = a.replace('fill="#3A1D1D"', 'fill="currentColor"').replace('bg-kakao transition-colors', 'bg-kakao text-kakao-icon transition-colors')
    (M / "app.html").write_text(a)
    return a


def build_brand():
    t = WORK / "brand.template.html"
    if not t.exists():
        return None
    b = t.read_text().replace("/*THEME*/", THEME)
    (M / "brand.html").write_text(b)
    return b


def check(name, html):
    body = html.split("</style>", 1)[1] if "</style>" in html else html
    css = html.split("</style>", 1)[0]
    bad = []
    for pat in [r"\bneutral-\d", r"\b(?:bg|text|border|divide|ring|outline|fill|stroke|decoration)-(?:black|white|gray|slate|zinc|stone|red|green|blue|emerald|teal|amber|yellow)\b",
                r"\[#[0-9a-fA-F]{3,8}\]", r"\b(?:fill|stroke|stop-color|color)=\"#[0-9a-fA-F]{3,8}\""]:
        for m in re.finditer(pat, body):
            bad.append(m.group(0))
    style_inline = re.findall(r'style="[^"]*#[0-9a-fA-F]{3,8}[^"]*"', body)
    css_after_theme = css.split("@layer base", 1)[1] if "@layer base" in css else ""
    css_hex = re.findall(r"#[0-9a-fA-F]{3,8}\b", css_after_theme)
    print(f"[check] {name}: 남은 하드코딩 클래스 {len(bad)} {sorted(set(bad))[:12]} · 인라인 style hex {len(style_inline)} · CSS hex(토큰 밖) {len(css_hex)} {sorted(set(css_hex))}")
    return not bad and not css_hex


if __name__ == "__main__":
    ok = True
    ok &= check("home", build_home())
    ok &= check("app", build_app())
    b = build_brand()
    if b is not None:
        ok &= check("brand", b)
    sys.exit(0 if ok else 1)
