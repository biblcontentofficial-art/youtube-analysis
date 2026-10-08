#!/usr/bin/env python3
"""brand.skeleton.html 의 <!--SWATCHES--> · <!--CONTRAST--> 를 계산한 대비값으로 채워 brand.template.html 을 만든다."""
import pathlib, html
from cvd_panel import cvd_panel

W = pathlib.Path(__file__).resolve().parent


def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def cr(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


GROUPS = [
    ("바탕·면·선", "그래파이트. 지금 사이트의 neutral 단계와 같은 값", [
        ("비즈니스 블랙", "#000000", "canvas", "페이지 바탕. 커뮤니티 이름 그대로", "bg-canvas"),
        ("그래파이트 950", "#0A0A0A", "surface", "카드·입력·검색창", "bg-surface"),
        ("그래파이트 900", "#171717", "surface-2 · line-soft", "hover·선택 행·표 행 구분", "bg-surface-2"),
        ("그래파이트 800", "#262626", "surface-3 · line · chart-grid", "구역 구분선·눌린 탭·차트 눈금", "bg-surface-3"),
        ("그래파이트 700", "#404040", "line-strong", "입력·보조 버튼·배지 테두리", "bg-line-strong"),
        ("그래파이트 600", "#525252", "line-hover · chart-3", "테두리 hover·보통 등급 막대", "bg-line-hover"),
    ]),
    ("글자·액센트", "실버 플레이 버튼에서 뽑은 무채색. 흰색과 실버가 액센트", [
        ("로고 판", "#E3E3E3", "logo-plate", "B 마크의 판. 실버 판의 하이라이트 면, 작은 크기에서도 켜져 보이게", "bg-logo-plate"),
        ("폴리시드 화이트", "#FFFFFF", "fg · accent · chart-1", "제목·숫자·핵심어·주 버튼·현재 위치·선택", "bg-accent"),
        ("하이라이트", "#E5E5E5", "fg-1 · accent-hover", "영상 제목, 흰 버튼 hover", "bg-fg-1"),
        ("실버 판", "#C6C6C6", "fg-2 · silver · accent-active", "본문·섹션 라벨·lab·실적 숫자의 +·첫 화면 제목 맥락", "bg-silver"),
        ("스틸", "#949494", "fg-3 · chart-2", "보조 글자·캡션·비교 계열", "bg-fg-3"),
        ("딤 스틸", "#7A7A7A", "fg-4 · line-control", "장식 화살표·체크박스 테두리. 작은 글자 하한", "bg-fg-4"),
    ]),
    ("기능 색 · 앱 전용", "액센트(흰·실버)와 뜻이 겹치지 않게 색상(hue)으로 구분", [
        ("포지티브", "#5EE39A", "positive · competition-low", "Great·Good 등급, 성공, 상승 ▲, 경쟁 낮음", "bg-positive"),
        ("코션", "#F5B73B", "caution · competition-mid", "Bad 등급, 경고, 남은 횟수 5회 이하, 경쟁 보통", "bg-caution"),
        ("네거티브", "#FA5570", "negative · competition-high", "Worst 등급, 오류, 하락 ▼, 경쟁 높음. 녹색약에서 초록과 밝기로 갈린다", "bg-negative"),
    ]),
    ("외부 브랜드", "그 회사 표시에만. 브랜드 색으로 넓히지 않는다", [
        ("유튜브 빨강", "#FF0000", "youtube", "유튜브 로고, 유튜브로 나가는 ↗ 의 hover 때만", "bg-youtube"),
        ("카카오 노랑", "#FEE500", "kakao · kakao-icon #3A1D1D · kakao-ink #191919", "카카오톡 상담 버튼·카카오 버튼", "bg-kakao"),
    ]),
]


def swatches():
    out = []
    for title, sub, items in GROUPS:
        cols = "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        out.append(f'''    <div class="mt-12">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h3 class="text-[20px] font-bold tracking-[-0.01em]">{html.escape(title)}</h3>
        <p class="text-[13px] text-fg-3">{html.escape(sub)}</p>
      </div>
      <ul class="mt-5 grid grid-cols-2 gap-3 {cols} lg:gap-4">''')
        for name, hx, tokens, role, cls in items:
            on_b, on_w = cr(hx, "#000000"), cr(hx, "#FFFFFF")
            out.append(f'''        <li class="panel flex flex-col overflow-hidden">
          <div class="swatch-chip {cls}"></div>
          <div class="flex flex-1 flex-col p-3.5 lg:p-4">
            <p class="text-[15px] font-bold leading-tight">{html.escape(name)}</p>
            <p class="tnum mt-1 text-[14px] font-semibold text-fg-2">{hx}</p>
            <p class="mt-1.5 text-[12px] leading-[1.5] text-fg-3">{html.escape(tokens)}</p>
            <p class="mb-3 mt-2 text-[13px] leading-[1.5] text-fg-2">{html.escape(role)}</p>
            <p class="tnum mt-auto flex flex-wrap gap-x-3 gap-y-0.5 border-t border-line-soft pt-2.5 text-[12px] text-fg-3"><span>검정 위 <b class="font-semibold text-fg-1">{on_b:.2f}</b></span><span>흰 위 <b class="font-semibold text-fg-1">{on_w:.2f}</b></span></p>
          </div>
        </li>''')
        out.append("      </ul>\n    </div>")
    return "\n".join(out)


# (쓰는 곳, 글자/요소 hex, 바탕 hex, 기준 'text'|'large'|'ui'|'deco')
ROWS = [
    ("제목·실적 숫자", "#FFFFFF", "#000000", "text"),
    ("핵심어·현재 위치·정렬 열 (액센트 흰색)", "#FFFFFF", "#000000", "text"),
    ("영상 제목 · 선택한 행 위", "#E5E5E5", "#171717", "text"),
    ("본문", "#C6C6C6", "#000000", "text"),
    ("본문 · 카드 안", "#C6C6C6", "#0A0A0A", "text"),
    ("섹션 라벨·실적 + (액센트 실버)", "#C6C6C6", "#000000", "text"),
    ("보조·캡션", "#949494", "#000000", "text"),
    ("보조 · 선택한 행 위", "#949494", "#171717", "text"),
    ("장식 화살표·구분 기호 (작은 글자 하한)", "#7A7A7A", "#000000", "text"),
    ("장식 화살표 · 카드 안", "#7A7A7A", "#0A0A0A", "text"),
    ("주 버튼 글자", "#000000", "#FFFFFF", "text"),
    ("주 버튼 글자 · hover", "#000000", "#E5E5E5", "text"),
    ("주 버튼 글자 · 누름", "#000000", "#C6C6C6", "text"),
    ("로고 B · 로고 판", "#000000", "#E3E3E3", "large"),
    ("로고 판 · 검정 바탕 위", "#E3E3E3", "#000000", "ui"),
    ("체크박스 테두리", "#7A7A7A", "#000000", "ui"),
    ("체크박스 테두리 · 선택한 행 위", "#7A7A7A", "#171717", "ui"),
    ("포커스 링 · 입력 중 테두리", "#FFFFFF", "#000000", "ui"),
    ("유튜브로 나가는 ↗ · 평소", "#949494", "#000000", "ui"),
    ("유튜브로 나가는 ↗ · hover", "#FF0000", "#000000", "ui"),
    ("좋음 글자 (포지티브)", "#5EE39A", "#171717", "text"),
    ("Great 배지 글자", "#000000", "#5EE39A", "text"),
    ("주의 글자 (코션)", "#F5B73B", "#171717", "text"),
    ("나쁨·오류 글자 (네거티브)", "#FA5570", "#171717", "text"),
    ("나쁨·오류 글자 · 검정 위", "#FA5570", "#000000", "text"),
    ("히트맵 숫자 · 2단계 위 흰색", "#FFFFFF", "#474747", "text"),
    ("히트맵 숫자 · 3단계 위 검정", "#000000", "#7A7A7A", "text"),
    ("카카오 말풍선", "#3A1D1D", "#FEE500", "ui"),
    ("흰 바탕 로고의 lab", "#6B6B6B", "#FFFFFF", "text"),
    ("입력·보조 버튼 테두리", "#404040", "#000000", "deco"),
    ("구역 구분선", "#262626", "#000000", "deco"),
]
TOKEN_BG = {"#FFFFFF": "bg-accent", "#000000": "bg-canvas", "#E5E5E5": "bg-fg-1", "#C6C6C6": "bg-silver", "#949494": "bg-fg-3",
            "#7A7A7A": "bg-fg-4", "#171717": "bg-surface-2", "#0A0A0A": "bg-surface", "#5EE39A": "bg-positive", "#E3E3E3": "bg-logo-plate", "#F5B73B": "bg-caution",
            "#FA5570": "bg-negative", "#FF0000": "bg-youtube", "#474747": "bg-heat-2", "#3A1D1D": "bg-kakao-icon", "#FEE500": "bg-kakao",
            "#6B6B6B": "bg-paper-muted", "#404040": "bg-line-strong", "#262626": "bg-line"}
NEED = {"text": (4.5, "본문 4.5"), "large": (3.0, "큰 글자 3"), "ui": (3.0, "UI 3"), "deco": (0, "장식")}


def contrast_table():
    def chip(hx):
        return f'<span class="size-3.5 shrink-0 rounded-[3px] border border-line-strong {TOKEN_BG[hx]}"></span>'
    trs, lis = [], []
    for where, fg, bg, kind in ROWS:
        r = cr(fg, bg)
        need, label = NEED[kind]
        if kind == "deco":
            verdict, short = '<span class="text-fg-3">장식 · 글자·아이콘으로 식별</span>', '<span class="text-fg-3">장식</span>'
        elif r >= need:
            verdict = short = '<span class="font-semibold text-fg">통과</span>'
        else:
            verdict = short = '<span class="font-semibold text-negative">미달</span>'
        trs.append(f'''          <tr>
            <td class="py-2.5 pl-5 pr-3 text-[14px] text-fg-1">{html.escape(where)}</td>
            <td class="py-2.5 pr-3"><span class="tnum flex items-center gap-2 text-[13px] text-fg-2">{chip(fg)}{fg}</span></td>
            <td class="py-2.5 pr-3"><span class="tnum flex items-center gap-2 text-[13px] text-fg-2">{chip(bg)}{bg}</span></td>
            <td class="tnum py-2.5 pr-4 text-right text-[15px] font-bold">{r:.2f}</td>
            <td class="py-2.5 pr-3 text-[13px] text-fg-3">{label}</td>
            <td class="py-2.5 pr-5 text-[13px]">{verdict}</td>
          </tr>''')
        lis.append(f'''        <li class="flex items-start justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <p class="text-[14px] leading-[1.45] text-fg-1">{html.escape(where)}</p>
            <p class="tnum mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[12px] text-fg-3">{chip(fg)}{fg}<span class="px-0.5">위</span>{chip(bg)}{bg}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="tnum text-[16px] font-bold leading-tight">{r:.2f}</p>
            <p class="mt-1 text-[12px] text-fg-3">{label + ' · ' + short if kind != 'deco' else '장식 · 글자로 식별'}</p>
          </div>
        </li>''')
    return f'''    <div class="panel mt-10 hidden overflow-hidden md:block">
      <table class="w-full text-left">
        <caption class="sr-only">팔레트 M 의 글자·요소와 바탕의 대비</caption>
        <thead class="text-[12px] text-fg-3">
          <tr class="border-b border-line">
            <th scope="col" class="py-3 pl-5 pr-3 font-medium">쓰는 곳</th>
            <th scope="col" class="py-3 pr-3 font-medium">글자·요소</th>
            <th scope="col" class="py-3 pr-3 font-medium">바탕</th>
            <th scope="col" class="py-3 pr-4 text-right font-medium">대비</th>
            <th scope="col" class="py-3 pr-3 font-medium">기준</th>
            <th scope="col" class="py-3 pr-5 font-medium">판정</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line-soft">
{chr(10).join(trs)}
        </tbody>
      </table>
    </div>
    <ul class="panel mt-8 divide-y divide-line-soft md:hidden" aria-label="팔레트 M 의 글자·요소와 바탕의 대비">
{chr(10).join(lis)}
    </ul>
    <p class="tnum mt-4 text-[13px] leading-[1.6] text-fg-3">유튜브 빨강 #FF0000 과 오류 빨강 #FA5570 은 밝기가 다르다(상대 휘도 {lum('#FF0000'):.2f} 대 {lum('#FA5570'):.2f}). 그래도 색만으로 구분하지 않고, 유튜브 빨강은 ↗ hover·로고 모양에만, 오류는 기호와 문장으로만 쓴다.</p>'''


if __name__ == "__main__":
    s = (W / "brand.skeleton.html").read_text()
    s = s.replace("<!--SWATCHES-->", swatches()).replace("<!--CONTRAST-->", contrast_table()).replace("<!--CVD-->", cvd_panel())
    (W / "brand.template.html").write_text(s)
    print("brand.template.html", len(s))
