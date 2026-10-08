"""브랜드 시트의 색약 검증 패널을 만든다(gen_brand.py 가 부른다)."""
import html
from cvd import sim, lab, de2000

CVD_COLORS = [("좋음", "#5EE39A", "▲ Great"), ("주의", "#F5B73B", "Bad"), ("나쁨", "#FA5570", "▼ Worst"), ("유튜브", "#FF0000", "↗")]
CVD_VIEWS = [("normal", "보통 시각"), ("deutan", "녹색약"), ("protan", "적색약")]


def hexof(c):
    return "#%02X%02X%02X" % tuple(round(x * 255) for x in c)


def dist(a, b, k):
    return de2000(lab(sim(a, k)), lab(sim(b, k)))


def cvd_panel():
    rows = []
    for key, name in CVD_VIEWS:
        chips = "".join(
            '<span class="flex min-w-0 flex-col items-start gap-1"><span class="h-7 w-full rounded-[5px]" style="background:%s"></span>'
            '<span class="text-[12px] font-semibold text-fg-2">%s</span></span>' % (hexof(sim(hx, key)), html.escape(lbl)) for _, hx, lbl in CVD_COLORS)
        rows.append('          <li class="grid grid-cols-[4.5rem_1fr] items-center gap-3 py-2.5"><span class="text-[13px] text-fg-3">%s</span><span class="grid grid-cols-4 gap-2">%s</span></li>' % (name, chips))
    pairs = [("좋음 ↔ 나쁨", "#5EE39A", "#FA5570"), ("좋음 ↔ 주의", "#5EE39A", "#F5B73B"), ("주의 ↔ 나쁨", "#F5B73B", "#FA5570")]
    trs = "".join(
        '<li class="flex flex-wrap items-baseline justify-between gap-x-4 py-2"><span class="text-[13px] text-fg-1">%s</span>'
        '<span class="tnum text-[13px] text-fg-3">녹색약 <b class="font-bold text-fg">%.1f</b> · 적색약 <b class="font-bold text-fg">%.1f</b> · 보통 %.1f</span></li>'
        % (a, dist(x, y, "deutan"), dist(x, y, "protan"), dist(x, y, "normal")) for a, x, y in pairs)
    old = dist("#3DD68C", "#FF7B72", "deutan")
    return ('        <ul class="mt-4 divide-y divide-line-soft">\n' + "\n".join(rows) + '\n        </ul>\n'
            '        <ul class="mt-3 divide-y divide-line-soft border-t border-line">' + trs + '</ul>\n'
            '        <p class="mt-4 text-[13px] leading-[1.6] text-fg-3">비교 시안의 좋음 #3DD68C ↔ 나쁨 #FF7B72 는 녹색약에서 %.1f 로 거의 같았다. '
            '나쁨을 #FA5570(더 어둡고 붉게), 좋음을 #5EE39A(더 밝게)로 옮겨 밝기 차이로 갈리게 했다. 그래도 색 하나로 말하지 않는다: ▲▼ 기호, Great·Worst 라벨, 경쟁도 칸 수를 함께 쓴다.</p>' % old)
