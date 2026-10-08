"""각 화면의 모든 요소에서 계산된 색(color·background-color·border-*-color·outline-color·fill·stroke)을 모아 토큰 값 밖의 색을 찾는다."""
import re, sys, pathlib
from playwright.sync_api import sync_playwright
M = pathlib.Path(__file__).resolve().parent.parent
theme = (M / "_work/theme-m.css").read_text()
tokens = {}
for name, hx in re.findall(r"--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})", theme):
    tokens.setdefault(hx.lower(), []).append(name)
def to_hex(c):
    m = re.match(r"rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)", c)
    if not m: return None, None
    r, g, b = (round(float(x)) for x in m.groups()[:3]); a = float(m.group(4)) if m.group(4) else 1.0
    return f"#{r:02x}{g:02x}{b:02x}", a
JS = """() => {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.tagName === 'IMG') continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const props = ['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke'];
    for (const p of props) {
      const v = cs[p];
      if (!v || v === 'none') continue;
      if (p.startsWith('border') && parseFloat(cs[p.replace('Color','Width')]) === 0) continue;
      if (p === 'outlineColor' && cs.outlineStyle === 'none') continue;
      if ((p === 'fill' || p === 'stroke') && !(el instanceof SVGElement)) continue;
      out.push([p, v, el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined ? '.' + String(el.className).split(' ').slice(0,3).join('.') : '')]);
    }
  }
  return out;
}"""
with sync_playwright() as pw:
    br = pw.chromium.launch(channel="chrome", headless=True)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    for f in sys.argv[1:]:
        pg.goto(f"file://{M}/{f}", wait_until="load"); pg.wait_for_timeout(1500)
        rows = pg.evaluate(JS)
        seen = {}
        for p, v, where in rows:
            hx, a = to_hex(v)
            if hx is None: 
                seen.setdefault(("?", v), set()).add(where); continue
            if a == 0: continue
            key = (hx, round(a, 2))
            seen.setdefault(key, set()).add(f"{p}@{where}")
        off = {k: v for k, v in seen.items() if k[0] == "?" or (k[0] not in tokens)}
        print(f"\n== {f}: 색 {len(seen)}종, 토큰 밖 {len(off)}종")
        for (hx, a), w in sorted(off.items(), key=lambda kv: -len(kv[1]))[:20]:
            print(f"   {hx} a={a}  ×{len(w)}  예: {sorted(w)[:3]}")
        on = sorted(k for k in seen if k[0] in tokens)
        print("   토큰 색:", ", ".join(f"{hx}{'' if a==1 else f'/{a}'}({tokens[hx][0]})" for hx, a in on))
    br.close()
