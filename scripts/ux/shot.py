#!/usr/bin/env python3
"""UX 리뉴얼 검증용 페이지 스크린샷 도구 (Python Playwright + 시스템 크롬 필요)

페이지 스크린샷 도구 (데스크톱 1440 / 모바일 390, 세로로 잘라 저장).

사용: python3 shot.py <base_url> <out_tag> <path> [<path> ...]
  예) python3 shot.py http://localhost:3001 after-r03 /pricing /studio

출력: <SHOT_OUT>/<out_tag>/<slug>-desktop-01.png ..., <slug>-mobile-01.png ..., manifest.json
- 스크롤 진입 애니메이션([data-animate])은 강제로 보이게 한다.
- 로그인이 필요한 페이지는 비로그인 화면(게이트·리다이렉트)이 찍힌다.
- 콘솔 에러·페이지 예외를 manifest 의 errors 에 기록하고 화면에도 출력한다.

환경변수
  SHOT_OUT         출력 루트 폴더 (기본: $TMPDIR/bibllab-shots)
  SHOT_VIEWS       desktop,mobile 중 선택 (기본 둘 다)
  SHOT_MAX_SLICES  조각 수 상한 (기본 desktop 14, mobile 18)
  SHOT_COOKIE      "이름=값" 쿠키를 심고 찍는다 (예: studio_access=1)
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
base, tag, paths = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3:]
out = os.path.join(os.environ.get("SHOT_OUT") or os.path.join(os.environ.get("TMPDIR", "/tmp"), "bibllab-shots"), tag)
os.makedirs(out, exist_ok=True)
mpath = os.path.join(out, "manifest.json")
manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}

VIEWS = {
    "desktop": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1, slice_h=1500, max_slices=14),
    "mobile": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, slice_h=1100, max_slices=18,
                   is_mobile=True, has_touch=True,
                   user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"),
}
want = [v.strip() for v in os.environ.get("SHOT_VIEWS", "desktop,mobile").split(",") if v.strip()]
cap = int(os.environ.get("SHOT_MAX_SLICES", "0") or 0)
FORCE = "[data-animate]{opacity:1!important;transform:none!important;transition:none!important}"

def slug(p):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", p.split("?")[0]).strip("-")
    return s or "home"

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome", headless=True)
    for vname in want:
        v = dict(VIEWS[vname]); slice_h = v.pop("slice_h"); max_slices = cap or v.pop("max_slices"); v.pop("max_slices", None)
        ctx = browser.new_context(**v, locale="ko-KR")
        ck = os.environ.get("SHOT_COOKIE", "")
        if "=" in ck:
            n, val = ck.split("=", 1)
            ctx.add_cookies([{"name": n, "value": val, "url": base}])
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text[:300]}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:300]}"))
        for p in paths:
            key = slug(p); entry = manifest.setdefault(key, {"path": p}); errors.clear()
            try:
                page.goto(base + p, wait_until="load", timeout=90000)
                page.wait_for_timeout(1200)
                page.add_style_tag(content=FORCE)
                h = page.evaluate("document.documentElement.scrollHeight")
                y = 0
                while y < h:  # 지연 로딩·인뷰 트리거를 위해 끝까지 훑는다
                    page.evaluate(f"window.scrollTo(0,{y})"); page.wait_for_timeout(120); y += 700
                page.evaluate("window.scrollTo(0,0)"); page.wait_for_timeout(400)
                h = page.evaluate("document.documentElement.scrollHeight")
                w = v["viewport"]["width"]
                sw = page.evaluate("document.documentElement.scrollWidth")
                files, y, i = [], 0, 1
                while y < h and i <= max_slices:
                    fn = f"{key}-{vname}-{i:02d}.png"
                    page.screenshot(path=os.path.join(out, fn), full_page=True,
                                    clip={"x": 0, "y": y, "width": w, "height": min(slice_h, h - y)})
                    files.append(fn); y += slice_h; i += 1
                errs = list(dict.fromkeys(errors))[:12]
                entry[vname] = {"final_url": page.url, "title": page.title(), "height": h, "slices": files,
                                "truncated": y < h, "h_overflow_px": max(0, sw - w), "errors": errs}
                flag = (" 가로넘침 %dpx" % (sw - w) if sw > w else "") + (" 에러 %d건" % len(errs) if errs else "")
                print(f"{vname:8s} {p:44s} h={h:6d} slices={len(files)}{' (잘림)' if y < h else ''}{flag} → {page.url.replace(base,'')}", flush=True)
                for e in errs[:4]:
                    print("          !", e[:200], flush=True)
            except Exception as e:
                entry[vname] = {"error": str(e)[:200]}
                print(f"{vname:8s} {p:44s} ERROR {str(e)[:120]}", flush=True)
        ctx.close()
    browser.close()
json.dump(manifest, open(mpath, "w"), ensure_ascii=False, indent=1)
print("manifest:", mpath)
