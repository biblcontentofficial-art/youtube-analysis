import sys
def lin(c):
    c=c/255
    return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def L(h):
    h=h.lstrip('#'); r,g,b=(int(h[i:i+2],16) for i in (0,2,4))
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def cr(a,b):
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
bgs={'black':'#000000','g950':'#0a0a0a','g900':'#171717','g800':'#262626','white':'#ffffff'}
cands=sys.argv[1:]
print('color     '+' '.join(f'{k:>7}' for k in bgs))
for c in cands:
    print(f'{c:9} '+' '.join(f'{cr(c,v):7.2f}' for v in bgs.values()))
