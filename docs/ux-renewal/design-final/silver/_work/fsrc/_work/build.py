#!/usr/bin/env python3
"""F 시안 빌드: 템플릿 + 결과 행 데이터(rows.json) + 채널 데이터 → ../home.html, ../app.html

- 결과 행은 2026-10-07 YouTube 공개 검색 결과('캠핑')를 옮긴 정적 데이터(시안 C 와 같은 출처, 제목의 이모지만 뺌).
- 홈 미리보기는 1~5행(모바일 1~3행), 앱은 10행 전부를 쓴다(앱 머리는 '50개', 나머지 40행은 그리지 않는다는 표시가 있다).
- {{ASSETS}} 는 이 시안의 assets 폴더 file:// 절대 경로로 바뀐다.
- 마지막에 가운뎃점 줄바꿈 보호를 한다(텍스트 노드만, 태그 속성·스크립트·스타일·주석은 건드리지 않는다).
    'A·B'   → 'A⁠·⁠B'  (U+2060 WORD JOINER: 가운뎃점 앞뒤에서 줄이 갈리지 않는다)
    'A · B' → 'A · B' (구분 점은 뒤 항목에 붙는다: 줄 끝에 점이 홀로 남지 않는다)
"""
import html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = "file://" + os.path.join(ROOT, "assets")
rows = json.load(open(os.path.join(HERE, "rows.json"), encoding="utf-8"))
e = lambda s: html.escape(s, quote=True)

# 홈 첫 화면 실적 열의 위 여백(제목 글자 윗선과 실적 열 글자 윗선을 맞춘다. pixalign.py 로 실측해 정한 값)
ASIDE_PT = "lg:pt-[2px] xl:pt-[4px]"


def thumb(r, q="mqdefault"):
    return f"https://i.ytimg.com/vi/{r['id']}/{q}.jpg"


def avatar(r, size=68):
    return r["chthumb"].replace("=s88-", f"=s{size}-").replace("=s68-", f"=s{size}-")


def dur(r, cls="bottom-1 right-1 px-1 py-0.5"):
    return f'<span class="tnum absolute {cls} rounded bg-black/80 text-micro font-semibold leading-none">{e(r["len"])}</span>'


IMG = 'loading="lazy" decoding="async"'


# ───────── 홈: 제품 미리보기 표(1024 이상). 앱 표와 같은 열: 1280 미만은 채널을 제목 아래로 ─────────
def home_table_rows(rs):
    out = []
    for r in rs:
        out.append(f"""            <tr>
              <td class="border-b border-neutral-900 py-3 pl-5 pr-6">
                <span class="flex items-center gap-4">
                  <span class="relative block w-32 shrink-0 overflow-hidden rounded-md bg-neutral-900"><img src="{thumb(r)}" alt="" width="320" height="180" class="aspect-video w-full object-cover" {IMG}>{dur(r)}</span>
                  <span class="min-w-0 flex-1">
                    <span class="line-clamp-2 text-ui leading-[1.5] text-neutral-100">{e(r['title'])}</span>
                    <span class="mt-1 flex min-w-0 items-center gap-2 text-caption text-neutral-400 xl:hidden"><img src="{avatar(r, 48)}" alt="" width="20" height="20" class="size-5 shrink-0 rounded-full bg-neutral-900" {IMG}><span class="truncate">{e(r['ch'])}</span></span>
                  </span>
                </span>
              </td>
              <td class="hidden border-b border-neutral-900 py-3 pr-4 xl:table-cell"><span class="flex min-w-0 items-center gap-2"><img src="{avatar(r)}" alt="" width="24" height="24" class="size-6 shrink-0 rounded-full bg-neutral-900" {IMG}><span class="truncate text-body-sm text-neutral-300">{e(r['ch'])}</span></span></td>
              <td class="tnum border-b border-neutral-900 py-3 pr-5 text-right text-base font-extrabold tracking-[-0.01em]">{e(r['v'])}</td>
              <td class="tnum border-b border-neutral-900 py-3 pr-5 text-right text-body-sm text-neutral-300">{e(r['s'])}</td>
              <td class="border-b border-neutral-900 py-3 pr-16 text-right text-body-sm text-neutral-400 min-[1376px]:pr-5">{e(r['pub'])}</td>
            </tr>""")
    return "\n".join(out)


# ───────── 홈: 제품 미리보기 목록(1024 미만). 메타 = 채널 한 줄 / 조회수 · 구독자 · 게시일(줄 넘침 시 뒤 항목만 내려감) ─────────
def meta_line(r, views_cls, subs=True, size="text-micro"):
    """조회수(굵게) · 구독자 · 게시일. 줄이 모자라면 뒤 항목만 다음 줄로(R18 모바일: 메타 12px · 조회수 14px 굵게).
    홈 미리보기(장식)는 구독자를 빼 짧게 둔다(화면 오른쪽 끝, 카카오 버튼 자리에 숫자가 오지 않게)"""
    tail = f'<span>· 구독자 {e(r["s"])}</span>' if subs else ''
    return (f'<span class="tnum mt-0.5 flex flex-wrap items-baseline gap-x-1 {size} text-neutral-400">'
            f'<span class="{views_cls}">{e(r["v"])}회</span>{tail}<span>· {e(r["pub"])}</span></span>')


def home_list_rows(rs):
    out = []
    for r in rs:
        out.append(f"""          <li class="flex gap-3 px-4 py-3.5 sm:px-5">
            <span class="relative block w-28 shrink-0 self-start overflow-hidden rounded-md bg-neutral-900 sm:w-36"><img src="{thumb(r)}" alt="" width="320" height="180" class="aspect-video w-full object-cover" {IMG}>{dur(r)}</span>
            <span class="min-w-0 flex-1">
              <span class="line-clamp-2 text-body-sm leading-[1.5] text-neutral-100">{e(r['title'])}</span>
              <span class="mt-1 block truncate text-micro text-neutral-400">{e(r['ch'])}</span>
              {meta_line(r, "text-body-sm font-extrabold leading-[1.4] tracking-[-0.02em] text-white", subs=False)}
            </span>
          </li>""")
    return "\n".join(out)


# ───────── 홈: 채널 실적 ─────────
EXT = '<svg class="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>'
CHANNELS = [
    {"name": "세계유명 골프정보", "topic": "골프", "subs": "25.8만", "url": "https://www.youtube.com/@세계유명골프정보",
     "avatar": "https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s240-c-k-c0x00ffffff-no-rj",
     "videos": [("9hndIlWLWaM", "드라이버 이게 전부입니다, 가장 쉽게 잘 치는 법"), ("XaT3VzlTnoI", "멀리 치고 싶다면 백스윙 회전 하지 마세요"), ("cBlr5P0_KcM", "아이언 툭 쳐서 가볍게 150m 보내는 방법")]},
    {"name": "영어 키위새", "topic": "영어 교육", "subs": "24.5만", "url": "https://www.youtube.com/@eng_kiwi",
     "avatar": "https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s240-c-k-c0x00ffffff-no-rj",
     "videos": [("-jWdORm55Kc", "외우지 말고 그냥 보세요, 영어말하기 코어동사 5개"), ("JHeJYy_A0aw", "퇴직후 영어공부 3년, 60대 엄마 말하기 진단"), ("4F2kGFDUo5M", "이거였구나, 영어 전치사 제대로 쓰는 방법")]},
    {"name": "스윔클래스", "topic": "수영", "subs": "8.57만", "url": "https://www.youtube.com/@swim_class",
     "avatar": "https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s240-c-k-c0x00ffffff-no-rj",
     "videos": [("_5ELU7Bx_J4", "발차기가 이런거였어? 편안한 발차기 꿀팁"), ("ouwAdBTIJwA", "내가 이걸 몰라서 수영할 때 숨이 찼구나"), ("yaw140V8dcM", "자유형 잘하고 싶다면 이대로만 해보세요")]},
    {"name": "비블 bibl", "topic": "사업·마케팅", "subs": "4.2만", "url": "https://www.youtube.com/@bibl_youtube",
     "avatar": "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj",
     "videos": [("N_816X7TFRU", "유튜브 5년동안 했더니 달라진 놀라운 변화"), ("Bnp0HyZXOAk", "돈 내고 쓰지 마세요, 쇼츠제작과 업로드 자동화"), ("0pyLmSNThh4", "에어비앤비 vs 단기임대, 이 순서대로만 따라하세요")]},
]


def yt_img(vid, title, sizes, extra_cls=""):
    srcset = (f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg 320w, "
              f"https://i.ytimg.com/vi/{vid}/sddefault.jpg 640w, "
              f"https://i.ytimg.com/vi/{vid}/maxresdefault.jpg 1280w")
    return (f'<img src="https://i.ytimg.com/vi/{vid}/mqdefault.jpg" srcset="{srcset}" sizes="{sizes}" '
            f'width="320" height="180" alt="{e(title)}" class="aspect-video w-full object-cover {extra_cls}" {IMG}>')


def channels_mobile():
    """640 미만: 4곳의 숫자를 2열 격자로 먼저, 대표 영상은 그 아래 한 줄 가로 넘김(카드 64%)."""
    cells, cards = [], []
    for c in CHANNELS:
        cells.append(f"""      <li class="min-w-0">
        <div class="flex items-center gap-2">
          <img src="{c['avatar']}" alt="" width="32" height="32" class="size-8 shrink-0 rounded-full bg-neutral-900" {IMG}>
          <a href="{c['url']}" class="-my-3 inline-flex min-h-11 min-w-0 items-center text-body-sm font-bold leading-[1.35] hover:underline hover:underline-offset-4"><span>{e(c['name'])} {EXT}</span></a>
        </div>
        <p class="tnum mt-3 text-[28px] font-extrabold leading-none tracking-[-0.03em]">{e(c['subs'])}</p>
        <p class="mt-1.5 text-caption text-neutral-400">{e(c['topic'])} · 구독자</p>
      </li>""")
        for vid, title in c["videos"][:2]:
            cards.append(f"""      <a href="https://www.youtube.com/watch?v={vid}" class="block w-[64%] shrink-0 snap-start">
        <span class="block overflow-hidden rounded-lg bg-neutral-900">{yt_img(vid, title, "64vw")}</span>
        <span class="mt-2 block truncate text-caption text-neutral-400">{e(c['name'])}</span>
      </a>""")
    return (f"""    <div class="mt-4 sm:hidden">
    <ul class="grid grid-cols-2 gap-x-4 gap-y-7 border-t border-neutral-800 pt-5">
{chr(10).join(cells)}
    </ul>
    <div class="no-scrollbar -mx-6 mt-7 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1" aria-label="대표 영상">
{chr(10).join(cards)}
    </div>
    </div>""")


def channels_desktop():
    """640 이상: 채널마다 한 줄(이름·구독자 | 썸네일 2~3장)."""
    items = []
    for c in CHANNELS:
        thumbs = []
        for k, (vid, title) in enumerate(c["videos"]):
            cls = "block" if k < 2 else "hidden lg:block"
            thumbs.append(f'          <a href="https://www.youtube.com/watch?v={vid}" class="{cls} overflow-hidden rounded-lg bg-neutral-900">{yt_img(vid, title, "(min-width: 1024px) 257px, 45vw")}</a>')
        items.append(f"""      <li class="grid gap-5 border-t border-neutral-800 py-7 lg:grid-cols-12 lg:gap-6 lg:py-9">
        <div class="flex flex-col gap-4 lg:col-span-4 lg:justify-between">
          <div class="flex items-center gap-3">
            <img src="{c['avatar']}" alt="" width="48" height="48" class="size-11 shrink-0 rounded-full bg-neutral-900 lg:size-12" {IMG}>
            <div class="min-w-0">
              <p class="text-lead font-extrabold leading-tight"><a href="{c['url']}" class="-my-3 inline-block py-3 hover:underline hover:underline-offset-4">{e(c['name'])} {EXT}</a></p>
              <p class="mt-1 text-caption text-neutral-400">{e(c['topic'])}</p>
            </div>
          </div>
          <p class="flex items-baseline gap-2 lg:block">
            <span class="tnum block text-[28px] font-extrabold leading-none tracking-[-0.03em] lg:text-[36px]">{e(c['subs'])}</span>
            <span class="block text-caption text-neutral-400 lg:mt-1.5">구독자</span>
          </p>
        </div>
        <div class="grid grid-cols-2 content-start gap-2 self-center lg:col-span-8 lg:grid-cols-3 lg:gap-4">
{chr(10).join(thumbs)}
        </div>
      </li>""")
    return f"""    <ol class="mt-4 hidden border-b border-neutral-800 sm:block">
{chr(10).join(items)}
    </ol>"""


# ───────── 앱: 결과 표(1024 이상) ─────────
SELECTED = {0, 2}  # 시안에서 '2개 선택' 상태를 보여 주는 행


def app_table_rows(rs):
    out = []
    for i, r in enumerate(rs):
        sel = i in SELECTED
        out.append(f"""        <tr class="row{' is-selected' if sel else ''}" data-row data-ch="{e(r['ch'])}">
          <td class="td"><label class="flex size-11 cursor-pointer items-center justify-center"><input type="checkbox" class="chk" aria-label="{e(r['title'])} 선택"{' checked' if sel else ''} data-pick data-i="{i}"></label></td>
          <td class="td relative pr-6">
            <div class="flex items-center gap-4">
              <span class="relative block w-32 shrink-0 overflow-hidden rounded-control bg-neutral-900 xl:w-36"><img src="{thumb(r)}" alt="" width="320" height="180" class="aspect-video w-full object-cover" {IMG}>{dur(r, "bottom-1.5 right-1.5 px-1.5 py-0.5")}</span>
              <div class="min-w-0 flex-1">
                <h3 class="text-ui font-medium text-neutral-100"><button type="button" class="open-btn line-clamp-2 text-left leading-[1.5] after:absolute after:inset-0 hover:underline hover:underline-offset-4" aria-haspopup="dialog" data-open data-i="{i}">{e(r['title'])}</button></h3>
                <p class="mt-1 flex min-w-0 items-center gap-2 text-caption text-neutral-400 xl:hidden"><img src="{avatar(r, 48)}" alt="" width="20" height="20" class="size-5 shrink-0 rounded-full bg-neutral-900" {IMG}><span class="truncate">{e(r['ch'])}</span></p>
              </div>
            </div>
          </td>
          <td class="td hidden pr-4 xl:table-cell"><span class="flex min-w-0 items-center gap-2.5"><img src="{avatar(r, 88)}" alt="" width="32" height="32" class="size-8 shrink-0 rounded-full bg-neutral-900" {IMG}><span class="truncate text-body-sm text-neutral-300">{e(r['ch'])}</span></span></td>
          <td class="td tnum pr-4 text-right"><span class="text-[18px] font-extrabold tracking-[-0.02em]" title="{e(r['views'].replace('조회수 ', ''))}">{e(r['v'])}</span></td>
          <td class="td tnum pr-4 text-right text-body-sm text-neutral-300">{e(r['s'])}</td>
          <td class="td pr-4 text-right text-body-sm text-neutral-400">{e(r['pub'])}</td>
          <td class="td"></td>
        </tr>""")
    return "\n".join(out)


# ───────── 앱: 결과 목록(1024 미만). 왼쪽 44px 띠 = 선택(화면 가장자리까지), 나머지 = 영상 정보 열기 ─────────
def app_list_rows(rs):
    out = []
    for i, r in enumerate(rs):
        sel = i in SELECTED
        out.append(f"""    <li class="row{' is-selected' if sel else ''} -mx-6 flex pl-[11px] pr-6" data-row data-ch="{e(r['ch'])}">
      <label class="flex w-11 shrink-0 cursor-pointer justify-center pt-[19px]"><input type="checkbox" class="chk" aria-label="{e(r['title'])} 선택"{' checked' if sel else ''} data-pick data-i="{i}"></label>
      <div class="relative flex min-w-0 flex-1 gap-3 py-4">
        <span class="relative block w-28 shrink-0 self-start overflow-hidden rounded-control bg-neutral-900 md:w-44"><img src="{thumb(r)}" alt="" width="320" height="180" class="aspect-video w-full object-cover" {IMG}>{dur(r)}</span>
        <div class="min-w-0 flex-1">
          <h3 class="text-ui font-medium text-neutral-100 md:text-body"><button type="button" class="open-btn line-clamp-2 text-left leading-[1.45] after:absolute after:inset-0" aria-haspopup="dialog" data-open data-i="{i}">{e(r['title'])}</button></h3>
          <p class="mt-1 truncate text-micro text-neutral-400">{e(r['ch'])}</p>
          {meta_line(r, "text-body-sm font-extrabold leading-[1.4] tracking-[-0.02em] text-white")}
        </div>
      </div>
    </li>""")
    return "\n".join(out)


def rows_json(rs):
    data = [{"id": r["id"], "title": r["title"], "ch": r["ch"], "s": r["s"], "views": r["views"].replace("조회수 ", "조회수 "),
             "pub": r["pub"], "len": r["len"], "avatar": avatar(r, 88)} for r in rs]
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


# ───────── 가운뎃점 줄바꿈 보호(텍스트 노드만) ─────────
WJ = "⁠"


def guard_dots(s):
    keep = []

    def stash(m):
        keep.append(m.group(0))
        return f"\x00{len(keep) - 1}\x00"

    s = re.sub(r"<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->", stash, s, flags=re.S)
    parts = re.split(r"(<[^>]+>)", s)
    for k, part in enumerate(parts):
        if part.startswith("<") or "·" not in part:
            continue
        part = re.sub(r"(?<=\S)·(?=\S)", WJ + "·" + WJ, part)   # A·B
        part = part.replace(" · ", " · ")                  # A · B → 점은 뒤 항목에 붙는다
        part = re.sub(r"^· ", "· ", part)                  # 요소 첫머리의 '· 항목'
        parts[k] = part
    s = "".join(parts)
    return re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], s)


def build(src, dst, repl):
    s = open(os.path.join(HERE, src), encoding="utf-8").read()
    for k, v in repl.items():
        s = s.replace("{{" + k + "}}", v)
    assert "{{" not in s, f"채우지 않은 자리표시가 남았다: {dst}"
    s = guard_dots(s)
    open(os.path.join(ROOT, dst), "w", encoding="utf-8").write(s)
    print("wrote", dst, len(s), "bytes")


build("home.template.html", "home.html", {
    "ASSETS": ASSETS,
    "ASIDE_PT": ASIDE_PT,
    "PREVIEW_TABLE": home_table_rows(rows[:5]),
    "PREVIEW_LIST": home_list_rows(rows[:3]),
    "CHANNELS_MOBILE": channels_mobile(),
    "CHANNELS_DESKTOP": channels_desktop(),
})
build("app.template.html", "app.html", {
    "ASSETS": ASSETS,
    "TABLE_ROWS": app_table_rows(rows[:10]),
    "LIST_ROWS": app_list_rows(rows[:10]),
    "ROWS_JSON": rows_json(rows[:10]),
})
