import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비블 TMK STUDIO — 검증된 유튜브 채널 대행",
  description:
    "총 70만 구독자 채널을 직접 운영한 비블이 여러분의 채널을 성장시킵니다. 기획·촬영·편집·분석까지 전 과정 올인원 채널 대행.",
  openGraph: {
    title: "비블 TMK STUDIO — 검증된 유튜브 채널 대행",
    description:
      "총 70만 구독자 채널을 직접 운영한 비블이 여러분의 채널을 성장시킵니다.",
    url: "https://tmklab.com",
    images: [{ url: "https://bibllab.com/studio/silver-play-button.jpg", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
};

export default function TmklabSitePage() {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#030712;--bg2:#0f172a;--border:#1f2937;--teal:#14b8a6;--teal-d:#0f766e;--teal-l:#5eead4;--text:#f9fafb;--muted:#9ca3af;--faint:#4b5563;--red:#f87171}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Noto Sans KR',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}img{display:block;max-width:100%}
nav{position:sticky;top:0;z-index:50;background:rgba(3,7,18,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 1.5rem;height:3.5rem;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:.6rem;font-weight:900;font-size:1.1rem;letter-spacing:-.02em}
.logo-icon{width:2rem;height:2rem;background:#000;border:1px solid var(--border);border-radius:.5rem;display:flex;align-items:center;justify-content:center}
.logo .teal{color:var(--teal)}
.nav-links{display:flex;align-items:center;gap:.25rem;list-style:none}
.nav-links a{font-size:.875rem;color:var(--muted);padding:.375rem .75rem;border-radius:.375rem;transition:color .2s,background .2s}
.nav-links a:hover{color:var(--text);background:#1f2937}
.nav-cta{font-size:.8125rem;font-weight:700;background:var(--teal);color:#fff;padding:.4rem 1rem;border-radius:.5rem;transition:background .2s}
.nav-cta:hover{background:var(--teal-l);color:var(--bg)}
.section{border-bottom:1px solid var(--border)}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.py-xl{padding-top:5rem;padding-bottom:5rem}
.py-2xl{padding-top:7rem;padding-bottom:7rem}
.hero{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(20,184,166,.08) 0%,var(--bg) 60%)}
.hero-glow{position:absolute;top:-8rem;right:-8rem;width:36rem;height:36rem;background:rgba(20,184,166,.05);border-radius:50%;filter:blur(5rem);pointer-events:none}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;padding-top:6rem;padding-bottom:6rem}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;font-size:.8125rem;color:var(--teal);background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.25);padding:.3rem .75rem;border-radius:999px;margin-bottom:1.25rem}
.hero-title{font-size:clamp(2.25rem,5vw,3.5rem);font-weight:900;line-height:1.1;letter-spacing:-.03em;margin-bottom:1.5rem}
.hero-title .teal{color:var(--teal)}
.hero-desc{color:var(--muted);font-size:1.0625rem;line-height:1.75;margin-bottom:2.5rem}
.btn-row{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1rem}
.btn-primary{display:inline-flex;align-items:center;gap:.5rem;background:var(--teal);color:#fff;font-weight:700;font-size:1rem;padding:.9rem 2rem;border-radius:.75rem;transition:background .2s,transform .15s;box-shadow:0 4px 24px rgba(20,184,166,.25)}
.btn-primary:hover{background:var(--teal-l);color:var(--bg);transform:translateY(-1px)}
.btn-secondary{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--border);color:var(--muted);font-weight:600;font-size:1rem;padding:.9rem 2rem;border-radius:.75rem;transition:border-color .2s,color .2s}
.btn-secondary:hover{border-color:var(--faint);color:var(--text)}
.hero-hint{font-size:.75rem;color:var(--faint)}
.hero-image-wrap{position:relative;width:100%;border-radius:1rem;overflow:hidden;border:1px solid var(--border);box-shadow:0 32px 64px rgba(0,0,0,.4);aspect-ratio:4/3}
.hero-image-wrap img{width:100%;height:100%;object-fit:cover}
.hero-img-caption{font-size:.875rem;color:var(--muted);margin-top:.75rem;line-height:1.6}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:1rem;overflow:hidden;margin-top:4rem}
.stat-cell{background:var(--bg);padding:2rem 1.5rem;text-align:center}
.stat-num{font-size:clamp(2rem,4vw,2.75rem);font-weight:900;color:var(--text);letter-spacing:-.04em;line-height:1;margin-bottom:.5rem}
.stat-num span{color:var(--teal)}
.stat-label{font-size:.875rem;color:var(--muted)}
.section-eyebrow{font-size:.6875rem;color:var(--faint);text-transform:uppercase;letter-spacing:.12em;margin-bottom:.75rem}
.section-title{font-size:clamp(1.625rem,3.5vw,2.5rem);font-weight:800;line-height:1.2;letter-spacing:-.025em;margin-bottom:1rem}
.section-sub{font-size:1rem;color:var(--muted);line-height:1.7}
.text-center{text-align:center}
.mb-14{margin-bottom:3.5rem}
.pain-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.pain-card{border:1px solid rgba(239,68,68,.2);background:rgba(127,29,29,.06);border-radius:1rem;padding:1.75rem}
.pain-num{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;background:rgba(239,68,68,.15);color:var(--red);border-radius:.5rem;font-size:.75rem;font-weight:700;margin-bottom:1rem}
.pain-title{font-weight:700;font-size:1rem;margin-bottom:.75rem}
.pain-desc{font-size:.875rem;color:var(--muted);line-height:1.7}
.solution-row{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;padding:3.5rem 0;border-bottom:1px solid rgba(255,255,255,.04)}
.solution-row:last-child{border-bottom:none}
.solution-row.reverse{direction:rtl}
.solution-row.reverse>*{direction:ltr}
.solution-num{display:inline-block;font-size:.75rem;font-weight:700;color:var(--teal);background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.2);padding:.2rem .6rem;border-radius:.375rem;margin-bottom:1rem}
.solution-title{font-size:1.5rem;font-weight:800;line-height:1.3;letter-spacing:-.02em;margin-bottom:1rem}
.solution-desc{font-size:.9375rem;color:var(--muted);line-height:1.8;white-space:pre-line}
.solution-img{width:100%;border-radius:.875rem;overflow:hidden;border:1px solid var(--border);box-shadow:0 16px 48px rgba(0,0,0,.3);aspect-ratio:16/10}
.solution-img img{width:100%;height:100%;object-fit:cover}
.channels-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem}
.channel-card{border:1px solid var(--border);border-radius:1rem;overflow:hidden;background:var(--bg2);transition:border-color .2s,transform .2s}
.channel-card:hover{border-color:rgba(20,184,166,.4);transform:translateY(-2px)}
.channel-banner{width:100%;height:7rem;object-fit:cover;background:#1f2937}
.channel-body{padding:1.25rem}
.channel-meta{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem}
.channel-avatar{width:2.75rem;height:2.75rem;border-radius:50%;border:2px solid var(--border)}
.channel-name{font-weight:700;font-size:.9375rem}
.channel-handle{font-size:.8125rem;color:var(--faint)}
.channel-tags{display:flex;gap:.5rem;flex-wrap:wrap}
.tag{font-size:.6875rem;font-weight:600;padding:.2rem .6rem;border-radius:999px;border:1px solid var(--border);color:var(--muted)}
.tag.teal{color:var(--teal);border-color:rgba(20,184,166,.3);background:rgba(20,184,166,.07)}
.channel-subs{font-size:1.25rem;font-weight:800;color:var(--text);margin-top:.75rem}
.channel-subs small{font-size:.8125rem;color:var(--muted);font-weight:400;margin-left:.25rem}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem}
.review-card{border:1px solid var(--border);border-radius:1rem;padding:1.5rem;background:var(--bg2)}
.review-result{display:inline-block;font-size:.6875rem;font-weight:700;color:var(--teal);background:rgba(20,184,166,.1);border:1px solid rgba(20,184,166,.2);padding:.2rem .6rem;border-radius:999px;margin-bottom:.875rem}
.review-text{font-size:.9375rem;color:var(--muted);line-height:1.7;margin-bottom:1rem}
.review-author{font-size:.8125rem;color:var(--faint);font-weight:600}
.faq-list{display:flex;flex-direction:column;gap:.75rem;max-width:800px;margin:0 auto}
.faq-item{border:1px solid var(--border);border-radius:.875rem;overflow:hidden;background:var(--bg2)}
.faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;font-size:.9375rem;font-weight:600;background:none;border:none;color:var(--text);cursor:pointer;text-align:left;transition:color .2s}
.faq-q:hover{color:var(--teal)}
.faq-q svg{flex-shrink:0;transition:transform .25s}
.faq-q.open svg{transform:rotate(180deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s;font-size:.9375rem;color:var(--muted);line-height:1.75}
.faq-a.open{max-height:300px;padding:0 1.5rem 1.25rem}
.cta-band{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(20,184,166,.12),rgba(20,184,166,.04));text-align:center}
.cta-band h2{font-size:clamp(1.75rem,3.5vw,2.75rem);font-weight:900;margin-bottom:1rem;letter-spacing:-.03em}
.cta-band p{color:var(--muted);margin-bottom:2.5rem;font-size:1rem}
footer{border-top:1px solid var(--border);padding:3rem 0 2rem;font-size:.8125rem;color:var(--faint)}
.footer-inner{max-width:1200px;margin:0 auto;padding:0 1.5rem;display:flex;flex-direction:column;gap:1rem}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1.5rem}
.footer-links{display:flex;gap:1.25rem;flex-wrap:wrap}
.footer-copy{color:var(--faint);opacity:.6;margin-top:1rem;font-size:.75rem}
.divider{height:1px;background:var(--border)}
.fade-up{opacity:0;transform:translateY(1.5rem);transition:opacity .6s ease,transform .6s ease}
.fade-up.visible{opacity:1;transform:none}
@media(max-width:900px){.hero-grid{grid-template-columns:1fr}.pain-grid{grid-template-columns:1fr}.solution-row{grid-template-columns:1fr;gap:2rem}.solution-row.reverse{direction:ltr}.stats-row{grid-template-columns:1fr}.nav-links,.nav-cta{display:none}}
@media(max-width:600px){.py-xl{padding-top:3rem;padding-bottom:3rem}.py-2xl{padding-top:4rem;padding-bottom:4rem}}
</style>
</head>
<body>
<nav>
  <div class="nav-inner">
    <a href="/" class="logo">
      <div class="logo-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M8 5.14v14l11-7-11-7z"/></svg></div>
      <span>TMK <span class="teal">STUDIO</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="#about">소개</a></li>
      <li><a href="#features">서비스</a></li>
      <li><a href="#channels">운영 채널</a></li>
      <li><a href="#reviews">후기</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <a href="#contact" class="nav-cta">무료 상담 →</a>
  </div>
</nav>

<section class="section hero" id="about">
  <div class="hero-glow"></div>
  <div class="container">
    <div class="hero-grid">
      <div>
        <span class="hero-badge">★ 총 70만+ 구독자 유튜브 크리에이터 '비블'</span>
        <h1 class="hero-title">검증된 유튜브 전문가와<br/><span class="teal">성장을 함께하세요</span></h1>
        <p class="hero-desc">70만 유튜브 채널을 운영·기획하고 비즈니스를 성공으로 이끈<br/>경험을 바탕으로 여러분의 유튜브를 무료로 상담해드립니다.</p>
        <div class="btn-row">
          <a href="#contact" class="btn-primary">무료 상담 바로가기 →</a>
          <a href="#features" class="btn-secondary">어떻게 진행되나요?</a>
        </div>
        <p class="hero-hint">채널 URL만 보내주시면 됩니다 · 완전 무료</p>
      </div>
      <div>
        <div class="hero-image-wrap">
          <img src="https://bibllab.com/studio/silver-play-button.jpg" onerror="this.src='https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80'" alt="유튜브 실버 플레이 버튼"/>
        </div>
        <p class="hero-img-caption">유튜브가 직접 수여한 실버 플레이 버튼.<br/>세계유명 골프정보 10만 구독자 달성</p>
      </div>
    </div>
    <div class="stats-row fade-up">
      <div class="stat-cell"><div class="stat-num">70<span>만+</span></div><div class="stat-label">총 구독자</div></div>
      <div class="stat-cell"><div class="stat-num">7<span>개</span></div><div class="stat-label">운영·공동기획 채널</div></div>
      <div class="stat-cell"><div class="stat-num">1<span>억+</span></div><div class="stat-label">누적 조회수</div></div>
    </div>
  </div>
</section>

<section class="section" style="background:rgba(15,23,42,.4)">
  <div class="container py-xl">
    <div class="text-center mb-14 fade-up">
      <p class="section-eyebrow">왜 혼자는 어려운가</p>
      <h2 class="section-title">유튜브 채널 운영,<br/><span style="color:var(--red)">혼자 하면 이 3가지에서 막힙니다</span></h2>
    </div>
    <div class="pain-grid">
      <div class="pain-card fade-up"><div class="pain-num">01</div><h3 class="pain-title">기획이 막막하다</h3><p class="pain-desc">무슨 주제로 찍어야 할지, 어떤 제목이 뜨는지 전혀 감이 안 옵니다. 경쟁자는 많고 내 영상만 아무도 안 봅니다.</p></div>
      <div class="pain-card fade-up"><div class="pain-num">02</div><h3 class="pain-title">시간이 없다</h3><p class="pain-desc">기획부터 촬영·편집까지 영상 하나에 10~20시간. 본업까지 병행하면 결국 업로드를 포기합니다.</p></div>
      <div class="pain-card fade-up"><div class="pain-num">03</div><h3 class="pain-title">뭐가 문제인지 모른다</h3><p class="pain-desc">올려도 조회수가 안 나옵니다. 썸네일인지, 제목인지, 내용인지 원인을 모르니 개선이 불가능합니다.</p></div>
    </div>
    <div class="text-center" style="margin-top:2.5rem">
      <a href="#contact" class="btn-primary" style="display:inline-flex">무료 진단 받기 →</a>
    </div>
  </div>
</section>

<section class="section" id="features">
  <div class="container py-xl">
    <div class="text-center mb-14 fade-up">
      <p class="section-eyebrow">서비스 상세</p>
      <h2 class="section-title">전 과정 올인원 채널 대행</h2>
      <p class="section-sub">기획부터 업로드·분석까지 — 여러분은 출연만 하면 됩니다</p>
    </div>
    <div class="solution-row fade-up">
      <div><span class="solution-num">01</span><h3 class="solution-title">전략적인 콘텐츠 &amp; 대본 기획</h3><p class="solution-desc">타겟 시청자의 행동 패턴을 분석한 콘텐츠 전략을 수립합니다.\n경쟁 채널을 분석해 방향을 잡고, 높은 시청 지속을 만드는 대본까지 함께 기획합니다.</p></div>
      <div class="solution-img"><img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80" alt="콘텐츠 기획"/></div>
    </div>
    <div class="solution-row reverse fade-up">
      <div><span class="solution-num">02</span><h3 class="solution-title">전문 장비 촬영 대행</h3><p class="solution-desc">장소 섭외부터 카메라·조명·음향까지 전문 장비로 직접 촬영합니다.\n출연자 디렉팅, 멘트 가이드까지 제공해 누구나 자연스럽게 카메라 앞에 설 수 있도록 돕습니다.</p></div>
      <div class="solution-img"><img src="https://images.unsplash.com/photo-1576671081837-49000212a370?w=900&q=80" alt="촬영 대행"/></div>
    </div>
    <div class="solution-row fade-up">
      <div><span class="solution-num">03</span><h3 class="solution-title">유튜브 최적화 고퀄리티 편집</h3><p class="solution-desc">유튜브 알고리즘에 최적화된 편집을 진행합니다.\n도입부 3초 훅부터 CTA까지 시청 지속률을 극대화하는 편집으로 2~3배 높은 조회수를 달성합니다.</p></div>
      <div class="solution-img"><img src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&q=80" alt="영상 편집"/></div>
    </div>
    <div class="solution-row reverse fade-up">
      <div><span class="solution-num">04</span><h3 class="solution-title">데이터 분석 &amp; 채널 성장 관리</h3><p class="solution-desc">매달 채널 데이터를 분석해 개선 포인트를 피드백합니다.\n제목·썸네일·SEO를 지속 최적화하고, 조회수를 실제 비즈니스 매출로 연결합니다.</p></div>
      <div class="solution-img"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80" alt="데이터 분석"/></div>
    </div>
  </div>
</section>

<section class="section" id="channels" style="background:rgba(15,23,42,.4)">
  <div class="container py-xl">
    <div class="text-center mb-14 fade-up">
      <p class="section-eyebrow">실제 운영 채널</p>
      <h2 class="section-title">말이 아닌, <span style="color:var(--teal)">실제 채널로 증명합니다</span></h2>
    </div>
    <div class="channels-grid">
      <a href="https://www.youtube.com/@세계유명골프정보" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/fNxhkFCNtSBP1dtg0i3W5oZKlohCyLhkNY8vUA1X8qC28L7q_t0QR9j_Ui-qaIq7f5hyiNAcWg=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/c1FBPCbt8LgbSD35amjUZOfgyqf-GjqpJ-XIx1rX37qyulT5Jscqumkqlk7SCCKWoj4xtdwaeQ4=s120" alt=""/><div><div class="channel-name">세계유명 골프정보</div><div class="channel-handle">@세계유명골프정보</div></div></div><div class="channel-subs">24.8만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">골프</span><span class="tag teal">0→24만</span></div></div></a>
      <a href="https://www.youtube.com/@eng_kiwi" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/-GU5UUOmKhc_zSCX2RCxc2FRG1ESh1EgLcS9A8AVUT5O9_RfRC4zFNH0pTyQXhisD4jrM6Xxww=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/s0W_yZEOUs466pSMRDegQDGeEJF5Q-TaCGgj4_gQ_eSSpROj0fnvVFXzU3QwmXgyP7-xxyRe=s120" alt=""/><div><div class="channel-name">영어 키위새</div><div class="channel-handle">@eng_kiwi</div></div></div><div class="channel-subs">23.5만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">영어교육</span><span class="tag teal">0→23만</span></div></div></a>
      <a href="https://www.youtube.com/@swim_class" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/fzwxJIRRnLH4cIGna2T7zi0tnEj9Mn6jayGPF9j0D-aPWLTTqEfXMGMwSnpzgYtvxwqXdIdFeg=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/DxGEnYcDFNMqQ4rqQ7sYFZFlPksnfh7BJOPOtYM_gDWlTrumru1ohHXga8Pko_xkPsUsrfSq_Hw=s120" alt=""/><div><div class="channel-name">스윔클래스</div><div class="channel-handle">@swim_class</div></div></div><div class="channel-subs">8.26만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">수영</span><span class="tag teal">월 조회수 300만+</span></div></div></a>
      <a href="https://www.youtube.com/@bibl_youtube" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/XDssFLodQnpmebO2quHSdHYPUroghTjlqATrtTahvyMNfVWUxTP4lr55XEKqLiUh-z2y2wJFaRQ=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s120" alt=""/><div><div class="channel-name">비블 bibl</div><div class="channel-handle">@bibl_youtube</div></div></div><div class="channel-subs">3.52만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">사업·마케팅</span><span class="tag teal">매출 연결</span></div></div></a>
      <a href="https://www.youtube.com/@baegopang1" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/oIYW7usbQ4Wp4MdOEmAYHPzFB28-l0chRQwLQ6MvI8cv3IkPbRdyApkwW4CFNrRLu43YO05rVW8=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/7lP38Oezdx8woNwzQcagjmiwMIjpacpOT3mXFetkFsKLetnyi9ymHenTMPUDMwIdjWaLkHYmIg=s120" alt=""/><div><div class="channel-name">배고팡</div><div class="channel-handle">@baegopang1</div></div></div><div class="channel-subs">3.31만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">음식</span><span class="tag teal">매출 40% 상승</span></div></div></a>
      <a href="https://www.youtube.com/@세계유명골프레슨" target="_blank" class="channel-card fade-up"><img class="channel-banner" src="https://yt3.googleusercontent.com/_MlBIxHi8Cvt7lTZg6F0svNJOVAz_Le2jthY8T6SS7ijj-auSC33JEKoYmy1CSpuq5Q8HPr-L7E=w600" alt="배너"/><div class="channel-body"><div class="channel-meta"><img class="channel-avatar" src="https://yt3.googleusercontent.com/JsHOMhsNg6GVEfeLgArKP5wappnficEWruFlxK8TRRf2_xpqBF3OQsbvkXu32srWaui02zppR_o=s120" alt=""/><div><div class="channel-name">세계유명 골프레슨</div><div class="channel-handle">@세계유명골프레슨</div></div></div><div class="channel-subs">1.16만<small>구독자</small></div><div class="channel-tags" style="margin-top:.5rem"><span class="tag">골프레슨</span><span class="tag teal">6개월 수익화</span></div></div></a>
    </div>
  </div>
</section>

<section class="section" id="reviews">
  <div class="container py-xl">
    <div class="text-center mb-14 fade-up">
      <p class="section-eyebrow">클라이언트 후기</p>
      <h2 class="section-title">숫자가 말하는 <span style="color:var(--teal)">실제 성과</span></h2>
    </div>
    <div class="reviews-grid">
      <div class="review-card fade-up"><span class="review-result">영상 노출 3배 증가</span><p class="review-text">"썸네일·제목만 바꿨더니 영상 노출이 폭발했습니다."</p><div class="review-author">체육 채널 운영 대표님</div></div>
      <div class="review-card fade-up"><span class="review-result">월 매출 +2,000만원</span><p class="review-text">"유튜브를 통해 체계화되며 월 매출이 2천만 원 이상 증가했습니다."</p><div class="review-author">사업자 대표님</div></div>
      <div class="review-card fade-up"><span class="review-result">전년 대비 매출 200%</span><p class="review-text">"전년 동월 대비 매출이 200% 성장했습니다. 신규 원생이 줄을 서고 있습니다."</p><div class="review-author">학원 원장님</div></div>
      <div class="review-card fade-up"><span class="review-result">영상 20만 뷰 달성</span><p class="review-text">"인스타그램 영상이 20만 회를 돌파하며 신규 고객이 늘었습니다."</p><div class="review-author">피부관리샵 대표님</div></div>
      <div class="review-card fade-up"><span class="review-result">매출 40% 상승</span><p class="review-text">"작년 대비 매출이 40% 상승했습니다. 이제는 손님 응대 인력을 추가 고민하고 있습니다."</p><div class="review-author">돈가스 매장 대표님</div></div>
      <div class="review-card fade-up"><span class="review-result">문의 3배 증가</span><p class="review-text">"스토리텔링 콘텐츠 전략을 적용하니 상품 문의가 3배 증가했습니다."</p><div class="review-author">쇼핑몰 운영자</div></div>
    </div>
  </div>
</section>

<section class="section" id="faq" style="background:rgba(15,23,42,.4)">
  <div class="container py-xl">
    <div class="text-center mb-14 fade-up"><p class="section-eyebrow">자주 묻는 질문</p><h2 class="section-title">FAQ</h2></div>
    <div class="faq-list">
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">대행 비용은 얼마인가요?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a">채널 현황과 원하시는 서비스 범위에 따라 달라집니다. 먼저 무료 진단을 받으신 후 맞춤 제안을 드립니다.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">최소 계약 기간이 있나요?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a">최소 3개월 계약을 권장합니다. 3개월 안에 가시적인 변화를 반드시 확인하실 수 있습니다.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">구독자 0명 채널도 가능한가요?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a">네, 구독자 0명부터 시작해도 됩니다. 채널이 없다면 처음부터 함께 설계합니다.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">어떤 분야든 가능한가요?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a">골프, 영어교육, 피트니스, 음식, 뷰티, 사업·마케팅 등 다양한 분야의 채널을 운영한 경험이 있습니다.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">촬영도 대행해주나요?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a">네, 기획·촬영·편집·업로드·분석까지 전 과정을 대행합니다. 여러분은 시간만 내주시면 됩니다.</div></div>
    </div>
  </div>
</section>

<section class="section cta-band" id="contact">
  <div class="container py-2xl">
    <div class="fade-up">
      <h2>지금 무료로 채널 진단 받으세요</h2>
      <p>채널 URL 하나만 보내주시면 현재 문제점과 성장 가능성을 무료로 분석해드립니다</p>
      <a href="https://pf.kakao.com/_xnKxnG" class="btn-primary" style="display:inline-flex;font-size:1.0625rem;padding:1rem 2.5rem">카카오톡으로 무료 상담 →</a>
      <p style="color:var(--faint);font-size:.8125rem;margin-top:1rem">영업일 기준 24시간 내 답변 · 완전 무료</p>
    </div>
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <a href="/" class="logo" style="margin-bottom:.75rem;display:inline-flex"><div class="logo-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M8 5.14v14l11-7-11-7z"/></svg></div><span>TMK <span class="teal">STUDIO</span></span></a>
        <p style="color:var(--faint);font-size:.8125rem;max-width:22rem;margin-top:.5rem">유튜브 채널 대행 · 검증된 전문가 비블과 함께 채널을 성장시키세요</p>
      </div>
      <div class="footer-links"><a href="#about">소개</a><a href="#features">서비스</a><a href="#channels">운영 채널</a><a href="#reviews">후기</a><a href="#faq">FAQ</a><a href="#contact">문의</a></div>
    </div>
    <div class="divider"></div>
    <p class="footer-copy">© 2025 TMK STUDIO · 비블 TMK. All rights reserved.</p>
  </div>
</footer>

<script>
function toggleFaq(btn){const a=btn.nextElementSibling,isOpen=a.classList.contains('open');document.querySelectorAll('.faq-a').forEach(x=>x.classList.remove('open'));document.querySelectorAll('.faq-q').forEach(x=>x.classList.remove('open'));if(!isOpen){a.classList.add('open');btn.classList.add('open')}}
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.fade-up').forEach(el=>obs.observe(el));
</script>
</body>
</html>`;

  return (
    <div
      style={{ margin: 0, padding: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
