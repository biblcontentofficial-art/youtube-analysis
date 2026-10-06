#!/usr/bin/env python3
"""next build 로그에서 라우트 표를 '렌더표시 경로' 줄로 뽑는다. 사용: parse-routes.py build.log > routes.txt"""
import re, sys
lines = open(sys.argv[1], encoding="utf-8").read().splitlines()
on = False
for l in lines:
    if l.startswith("Route (app)"): on = True; continue
    if on and (l.startswith("+ First Load JS") or l.startswith("ƒ Middleware") or not l.strip()): break
    if on:
        m = re.match(r"^[┌├└]\s+([○●ƒλ◐])\s+(\S+)", l)
        if m: print(m.group(1), m.group(2))
