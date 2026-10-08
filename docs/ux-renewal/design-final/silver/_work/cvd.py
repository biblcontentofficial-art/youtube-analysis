"""색각 이상 시뮬레이션(Machado 2009, 강도 1.0) + CIEDE2000 거리 + WCAG 대비."""
import math, sys
def lin(c):
    c/=255; return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def gam(c):
    c=min(max(c,0),1); return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
def rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16) for i in (0,2,4)]
def L(h): r,g,b=(lin(x) for x in rgb(h)); return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b): la,lb=L(a),L(b); return (max(la,lb)+.05)/(min(la,lb)+.05)
M={'deutan':[[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],
   'protan':[[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],
   'tritan':[[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]]}
def sim(h,k):
    v=[lin(x) for x in rgb(h)]
    if k=='normal': o=v
    else: o=[sum(M[k][i][j]*v[j] for j in range(3)) for i in range(3)]
    return [gam(x) for x in o]
def lab(c):
    r,g,b=c; r,g,b=[(x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4) for x in (r,g,b)]
    X=(0.4124*r+0.3576*g+0.1805*b)/0.95047; Y=0.2126*r+0.7152*g+0.0722*b; Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    return 116*f(Y)-16, 500*(f(X)-f(Y)), 200*(f(Y)-f(Z))
def de2000(l1,l2):
    L1,a1,b1=l1; L2,a2,b2=l2
    C1=math.hypot(a1,b1); C2=math.hypot(a2,b2); Cb=(C1+C2)/2
    G=0.5*(1-math.sqrt(Cb**7/(Cb**7+25**7))); a1p=(1+G)*a1; a2p=(1+G)*a2
    C1p=math.hypot(a1p,b1); C2p=math.hypot(a2p,b2)
    h1p=math.degrees(math.atan2(b1,a1p))%360; h2p=math.degrees(math.atan2(b2,a2p))%360
    dLp=L2-L1; dCp=C2p-C1p
    dh=h2p-h1p
    if C1p*C2p==0: dh=0
    elif dh>180: dh-=360
    elif dh<-180: dh+=360
    dHp=2*math.sqrt(C1p*C2p)*math.sin(math.radians(dh/2))
    Lbp=(L1+L2)/2; Cbp=(C1p+C2p)/2
    if C1p*C2p==0: hbp=h1p+h2p
    elif abs(h1p-h2p)<=180: hbp=(h1p+h2p)/2
    elif h1p+h2p<360: hbp=(h1p+h2p+360)/2
    else: hbp=(h1p+h2p-360)/2
    T=1-0.17*math.cos(math.radians(hbp-30))+0.24*math.cos(math.radians(2*hbp))+0.32*math.cos(math.radians(3*hbp+6))-0.20*math.cos(math.radians(4*hbp-63))
    dth=30*math.exp(-((hbp-275)/25)**2); Rc=2*math.sqrt(Cbp**7/(Cbp**7+25**7))
    Sl=1+0.015*(Lbp-50)**2/math.sqrt(20+(Lbp-50)**2); Sc=1+0.045*Cbp; Sh=1+0.015*Cbp*T; Rt=-math.sin(math.radians(2*dth))*Rc
    return math.sqrt((dLp/Sl)**2+(dCp/Sc)**2+(dHp/Sh)**2+Rt*(dCp/Sc)*(dHp/Sh))
def d(a,b,k): return de2000(lab(sim(a,k)),lab(sim(b,k)))
if __name__=='__main__':
    pairs=[a.split(',') for a in sys.argv[1:]]
    for a,b in pairs:
        print(f"{a} vs {b}: "+"  ".join(f"{k} {d(a,b,k):5.1f}" for k in ['normal','deutan','protan','tritan'])+f"   대비 #171717 {cr(a,'#171717'):.2f}/{cr(b,'#171717'):.2f}")
