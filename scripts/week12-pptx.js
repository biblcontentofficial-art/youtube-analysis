const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "팀비블";
pres.title = "프리미어 프로 12주차 강의";

// ─── 디자인 토큰 ───────────────────────────────────────────────
const C = {
  bg:      "111111",
  surface: "1A1A1A",
  surface2:"222222",
  border:  "2A2A2A",
  accent:  "0000FF",  // 포인트: 파란색
  accentD: "0000CC",  // 다크 파랑
  accentL: "3355FF",  // 라이트 파랑
  white:   "F2F2F2",
  muted:   "666666",
  dim:     "2A2A2A",
  red:     "FF3B30",
  green:   "00D084",
};
const FONT = "Pretendard";
const W = 10, H = 5.625;
const IMG = (name) => {
  // pp_ 접두어는 프리미어 프로 실제 스크린샷 (PNG)
  if (name.startsWith("pp_")) {
    return path.join(__dirname, "images", "premiere", `${name}.png`);
  }
  return path.join(__dirname, "images", `${name}.jpg`);
};

// ─── 기본 헬퍼 ───────────────────────────────────────────────
function bg(slide) { slide.background = { color: C.bg }; }

function slideNum(slide, n) {
  slide.addText(`${n} / 70`, {
    x: 8.8, y: 5.22, w: 1.0, h: 0.22,
    fontFace: FONT, fontSize: 8, color: C.muted, align: "right", margin: 0
  });
}

function accentBar(slide, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.045, fill: { color: color || C.accent }
  });
}

function label(slide, text, x, y) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 7, h: 0.25,
    fontFace: FONT, fontSize: 7.5, bold: true, color: C.muted,
    charSpacing: 3, margin: 0
  });
}

function divider(slide, y) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y, w: 9, h: 0.015, fill: { color: C.border }
  });
}

// ─── 이미지 패널 (우측 고정) ───────────────────────────────────
// 오른쪽 약 40% 영역에 이미지 배치, 반투명 오버레이
function imgPanel(slide, imgPath, opts) {
  const ox = opts && opts.x !== undefined ? opts.x : 5.85;
  const oy = opts && opts.y !== undefined ? opts.y : 1.2;
  const ow = opts && opts.w !== undefined ? opts.w : 3.95;
  const oh = opts && opts.h !== undefined ? opts.h : 4.1;

  // 이미지
  try {
    slide.addImage({
      path: imgPath,
      x: ox, y: oy, w: ow, h: oh,
      sizing: { type: "cover", w: ow, h: oh }
    });
  } catch(e) {}

  // 다크 오버레이 (왼쪽 페이드)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: ox, y: oy, w: 0.6, h: oh,
    fill: { color: C.bg, transparency: 0 }
  });

  // 악센트 테두리 (좌측)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: ox, y: oy, w: 0.04, h: oh,
    fill: { color: C.accent }
  });
}

// 전체화면 배경 이미지 (반투명)
function bgImage(slide, imgPath, transparency) {
  try {
    slide.addImage({
      path: imgPath,
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: transparency !== undefined ? transparency : 75
    });
  } catch(e) {}
}

// ─── 슬라이드 타입: 강의 커버 ───────────────────────────────────
function lectureCover(lectureNum, title, keywords, duration, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);

  // 배경 이미지 (우측 절반)
  try {
    slide.addImage({
      path: IMG(imgName),
      x: 4.5, y: 0, w: 5.5, h: H,
      sizing: { type: "cover", w: 5.5, h: H },
      transparency: 30
    });
  } catch(e) {}

  // 좌측 다크 그라디언트 효과 (사각형 반투명)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 6.5, h: H, fill: { color: C.bg, transparency: 0 }
  });

  accentBar(slide);
  label(slide, `12주차 · ${lectureNum}강`, 0.6, 0.6);

  slide.addText(title, {
    x: 0.6, y: 1.1, w: 7, h: 1.8,
    fontFace: FONT, fontSize: 38, bold: true, color: C.white,
    margin: 0, wrap: true
  });

  // 악센트 구분선
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.05, w: 1.5, h: 0.045, fill: { color: C.accent }
  });

  // 키워드 태그
  keywords.forEach((kw, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6 + i * 2.6, y: 3.3, w: 2.3, h: 0.4, fill: { color: C.surface2 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6 + i * 2.6, y: 3.3, w: 0.04, h: 0.4, fill: { color: C.accent }
    });
    slide.addText(kw, {
      x: 0.75 + i * 2.6, y: 3.3, w: 2.1, h: 0.4,
      fontFace: FONT, fontSize: 11, color: C.white,
      margin: 0, valign: "middle"
    });
  });

  slide.addText(`⏱  ${duration}`, {
    x: 0.6, y: 3.95, w: 3, h: 0.35,
    fontFace: FONT, fontSize: 11, color: C.muted, margin: 0
  });

  // 강 번호 대형 배경 텍스트
  slide.addText(`0${lectureNum}`, {
    x: 7.5, y: 3.5, w: 2.5, h: 2,
    fontFace: FONT, fontSize: 120, bold: true, color: C.accent,
    align: "center", margin: 0, transparency: 75
  });

  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 목차 ───────────────────────────────────────
function tocSlide(lectureNum, lectureTitle, items, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);

  // 우측 이미지 패널
  try {
    slide.addImage({
      path: IMG(imgName),
      x: 6.5, y: 0, w: 3.5, h: H,
      sizing: { type: "cover", w: 3.5, h: H },
      transparency: 50
    });
  } catch(e) {}
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.5, y: 0, w: 3.5, h: H, fill: { color: C.bg, transparency: 30 }
  });

  accentBar(slide);
  label(slide, `${lectureNum}강 목차`, 0.5, 0.48);
  slide.addText(lectureTitle, {
    x: 0.5, y: 0.82, w: 5.8, h: 0.65,
    fontFace: FONT, fontSize: 22, bold: true, color: C.white, margin: 0
  });
  divider(slide, 1.55);

  items.forEach((item, i) => {
    const y = 1.72 + i * 0.56;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 5.8, h: 0.5,
      fill: { color: i % 2 === 0 ? C.surface : C.bg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.04, h: 0.5, fill: { color: C.accent }
    });
    slide.addText(`${String(i+1).padStart(2,"0")}`, {
      x: 0.65, y: y + 0.03, w: 0.45, h: 0.44,
      fontFace: FONT, fontSize: 9, bold: true, color: C.accent,
      margin: 0, valign: "middle"
    });
    slide.addText(item, {
      x: 1.2, y: y + 0.03, w: 4.9, h: 0.44,
      fontFace: FONT, fontSize: 12.5, color: C.white,
      margin: 0, valign: "middle"
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 콘텐츠 (좌측 텍스트 + 우측 이미지) ──────────
function contentSlide(lbl, title, points, slideIdx, imgName, titleColor) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  // 우측 이미지
  imgPanel(slide, IMG(imgName || "cover_main"));

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 5.1, h: 0.72,
    fontFace: FONT, fontSize: 22, bold: true,
    color: titleColor || C.white, margin: 0, wrap: true
  });
  divider(slide, 1.62);

  points.forEach((pt, i) => {
    const isObj = typeof pt === "object";
    const mainText = isObj ? pt.main : pt;
    const subText  = isObj ? pt.sub  : null;
    const y = 1.8 + i * 0.68;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: y + 0.03, w: 0.06, h: 0.3, fill: { color: C.accent }
    });
    slide.addText(mainText, {
      x: 0.72, y, w: 4.9, h: 0.33,
      fontFace: FONT, fontSize: 12.5, bold: true, color: C.white,
      margin: 0, wrap: true
    });
    if (subText) {
      slide.addText(subText, {
        x: 0.72, y: y + 0.33, w: 4.9, h: 0.28,
        fontFace: FONT, fontSize: 10, color: C.muted, margin: 0, wrap: true
      });
    }
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 단계별 프로세스 ─────────────────────────────
function stepsSlide(lbl, title, steps, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);
  imgPanel(slide, IMG(imgName || "cover_main"), { x: 5.85, y: 1.2, w: 3.95, h: 4.1 });

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 5.1, h: 0.72,
    fontFace: FONT, fontSize: 20, bold: true, color: C.white, margin: 0, wrap: true
  });
  divider(slide, 1.62);

  steps.forEach((step, i) => {
    const y = 1.8 + i * 0.73;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.42, h: 0.42, fill: { color: C.accent }
    });
    slide.addText(`${i+1}`, {
      x: 0.5, y, w: 0.42, h: 0.42,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0
    });
    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.69, y: y + 0.42, w: 0.03, h: 0.31, fill: { color: C.border }
      });
    }
    slide.addText(step.title, {
      x: 1.1, y: y + 0.02, w: 4.5, h: 0.28,
      fontFace: FONT, fontSize: 12.5, bold: true, color: C.white, margin: 0
    });
    slide.addText(step.desc, {
      x: 1.1, y: y + 0.3, w: 4.5, h: 0.28,
      fontFace: FONT, fontSize: 10, color: C.muted, margin: 0, wrap: true
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 통계 카드 ─────────────────────────────────
function statSlide(lbl, title, stats, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  // 배경 이미지 (전체, 매우 어둡게)
  try {
    slide.addImage({
      path: IMG(imgName || "cover_main"),
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: 85
    });
  } catch(e) {}

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 9, h: 0.58,
    fontFace: FONT, fontSize: 20, bold: true, color: C.white, margin: 0
  });
  divider(slide, 1.5);

  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 0.5 + col * 3.05, by = 1.68 + row * 1.72;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: bx, y: by, w: 2.85, h: 1.55, fill: { color: C.surface }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: bx, y: by, w: 2.85, h: 0.045, fill: { color: C.accent }
    });
    slide.addText(s.value, {
      x: bx + 0.15, y: by + 0.15, w: 2.55, h: 0.7,
      fontFace: FONT, fontSize: 30, bold: true, color: C.accent, margin: 0
    });
    slide.addText(s.label, {
      x: bx + 0.15, y: by + 0.82, w: 2.55, h: 0.6,
      fontFace: FONT, fontSize: 10.5, color: C.white, margin: 0, wrap: true
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: Before/After ──────────────────────────────
function beforeAfterSlide(lbl, title, before, after, note, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  // 상단 이미지 스트립
  try {
    slide.addImage({
      path: IMG(imgName || "cover_main"),
      x: 0, y: 0.045, w: W, h: 0.9,
      sizing: { type: "cover", w: W, h: 0.9 },
      transparency: 70
    });
  } catch(e) {}
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.045, w: W, h: 0.9, fill: { color: C.bg, transparency: 30 }
  });

  label(slide, lbl, 0.5, 0.1);
  slide.addText(title, {
    x: 0.5, y: 0.18, w: 9, h: 0.55,
    fontFace: FONT, fontSize: 20, bold: true, color: C.white, margin: 0
  });
  divider(slide, 1.05);

  // BEFORE
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.15, w: 4.3, h: 4.05, fill: { color: C.surface }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.15, w: 4.3, h: 0.045, fill: { color: C.red }
  });
  slide.addText("BEFORE", {
    x: 0.55, y: 1.22, w: 4, h: 0.35,
    fontFace: FONT, fontSize: 11, bold: true, color: C.red, charSpacing: 2, margin: 0
  });
  before.forEach((line, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y: 1.68 + i * 0.48, w: 0.06, h: 0.28, fill: { color: C.red }
    });
    slide.addText(line, {
      x: 0.72, y: 1.68 + i * 0.48, w: 3.8, h: 0.38,
      fontFace: FONT, fontSize: 11, color: C.white, margin: 0, wrap: true
    });
  });

  // VS
  slide.addText("VS", {
    x: 4.4, y: 2.8, w: 1.2, h: 0.5,
    fontFace: FONT, fontSize: 18, bold: true, color: C.muted,
    align: "center", margin: 0
  });

  // AFTER
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.15, w: 4.3, h: 4.05, fill: { color: C.surface }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.15, w: 4.3, h: 0.045, fill: { color: C.green }
  });
  slide.addText("AFTER", {
    x: 5.45, y: 1.22, w: 4, h: 0.35,
    fontFace: FONT, fontSize: 11, bold: true, color: C.green, charSpacing: 2, margin: 0
  });
  after.forEach((line, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.45, y: 1.68 + i * 0.48, w: 0.06, h: 0.28, fill: { color: C.green }
    });
    slide.addText(line, {
      x: 5.62, y: 1.68 + i * 0.48, w: 3.8, h: 0.38,
      fontFace: FONT, fontSize: 11, color: C.white, margin: 0, wrap: true
    });
  });

  if (note) {
    slide.addText(`💡  ${note}`, {
      x: 0.4, y: 5.3, w: 9.2, h: 0.25,
      fontFace: FONT, fontSize: 9.5, color: C.muted, margin: 0
    });
  }
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 팁 ──────────────────────────────────────────
function tipsSlide(lbl, title, tips, slideIdx, imgName, tipColor) {
  const tc = tipColor || C.accent;
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);
  imgPanel(slide, IMG(imgName || "cover_main"));

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 5.1, h: 0.72,
    fontFace: FONT, fontSize: 20, bold: true, color: C.white, margin: 0, wrap: true
  });
  divider(slide, 1.62);

  tips.forEach((tip, i) => {
    const isObj = typeof tip === "object";
    const icon = isObj ? tip.icon : "▶";
    const text = isObj ? tip.text : tip;
    const y = 1.8 + i * 0.68;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.42, h: 0.42,
      fill: { color: tc === C.accent ? C.surface2 : "220000" }
    });
    slide.addText(icon, {
      x: 0.5, y, w: 0.42, h: 0.42,
      fontFace: FONT, fontSize: 13, color: tc,
      align: "center", valign: "middle", margin: 0
    });
    slide.addText(text, {
      x: 1.1, y: y + 0.04, w: 4.5, h: 0.42,
      fontFace: FONT, fontSize: 12, color: C.white, margin: 0, wrap: true
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 단축키 ──────────────────────────────────────
function shortcutSlide(lbl, title, shortcuts, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  // 배경 이미지 희미하게
  try {
    slide.addImage({
      path: IMG(imgName || "code1"),
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: 88
    });
  } catch(e) {}

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 9, h: 0.58,
    fontFace: FONT, fontSize: 22, bold: true, color: C.white, margin: 0
  });
  divider(slide, 1.5);

  shortcuts.forEach((sc, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75, y = 1.68 + row * 0.72;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.55, h: 0.58, fill: { color: C.surface }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 3.05, y, w: 1.5, h: 0.58, fill: { color: C.surface2 }
    });
    slide.addText(sc.action, {
      x: x + 0.15, y: y + 0.05, w: 2.8, h: 0.48,
      fontFace: FONT, fontSize: 12, color: C.white, margin: 0, valign: "middle"
    });
    slide.addText(sc.key, {
      x: x + 3.05, y: y + 0.05, w: 1.5, h: 0.48,
      fontFace: FONT, fontSize: 11, bold: true, color: C.accent,
      align: "center", valign: "middle", margin: 0
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 요약 ──────────────────────────────────────
function summarySlide(lbl, title, summaries, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  try {
    slide.addImage({
      path: IMG(imgName || "cover_main"),
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: 88
    });
  } catch(e) {}

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 9, h: 0.65,
    fontFace: FONT, fontSize: 24, bold: true, color: C.accent, margin: 0
  });
  divider(slide, 1.58);

  summaries.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.75, y = 1.75 + row * 1.62;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.55, h: 1.45, fill: { color: C.surface }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.45, fill: { color: C.accent }
    });
    slide.addText(s.title, {
      x: x + 0.2, y: y + 0.12, w: 4.2, h: 0.38,
      fontFace: FONT, fontSize: 13, bold: true, color: C.accent, margin: 0
    });
    slide.addText(s.desc, {
      x: x + 0.2, y: y + 0.52, w: 4.2, h: 0.78,
      fontFace: FONT, fontSize: 11, color: C.white, margin: 0, wrap: true
    });
  });
  slideNum(slide, slideIdx);
}

// ─── 슬라이드 타입: 2컬럼 비교 ───────────────────────────────
function twoColSlide(lbl, title, leftTitle, leftItems, rightTitle, rightItems, slideIdx, imgName) {
  const slide = pres.addSlide();
  bg(slide);
  accentBar(slide);

  // 배경 이미지 희미하게
  try {
    slide.addImage({
      path: IMG(imgName || "cover_main"),
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: 88
    });
  } catch(e) {}

  label(slide, lbl, 0.5, 0.48);
  slide.addText(title, {
    x: 0.5, y: 0.82, w: 9, h: 0.65,
    fontFace: FONT, fontSize: 20, bold: true, color: C.white, margin: 0, wrap: true
  });
  divider(slide, 1.58);

  // 왼쪽 패널
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.72, w: 4.3, h: 3.7, fill: { color: C.surface }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.45, y: 1.72, w: 4.3, h: 0.045, fill: { color: C.accent }
  });
  slide.addText(leftTitle, {
    x: 0.6, y: 1.82, w: 4.0, h: 0.38,
    fontFace: FONT, fontSize: 13, bold: true, color: C.accent, margin: 0
  });
  leftItems.forEach((item, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 2.28 + i * 0.48, w: 0.05, h: 0.28, fill: { color: C.accent }
    });
    slide.addText(item, {
      x: 0.76, y: 2.26 + i * 0.48, w: 3.8, h: 0.4,
      fontFace: FONT, fontSize: 11.5, color: C.white, margin: 0, wrap: true
    });
  });

  // 오른쪽 패널
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.25, y: 1.72, w: 4.3, h: 3.7, fill: { color: C.surface }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.25, y: 1.72, w: 4.3, h: 0.045, fill: { color: C.accentL }
  });
  slide.addText(rightTitle, {
    x: 5.4, y: 1.82, w: 4.0, h: 0.38,
    fontFace: FONT, fontSize: 13, bold: true, color: C.accentL, margin: 0
  });
  rightItems.forEach((item, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.4, y: 2.28 + i * 0.48, w: 0.05, h: 0.28, fill: { color: C.accentL }
    });
    slide.addText(item, {
      x: 5.56, y: 2.26 + i * 0.48, w: 3.8, h: 0.4,
      fontFace: FONT, fontSize: 11.5, color: C.white, margin: 0, wrap: true
    });
  });
  slideNum(slide, slideIdx);
}

// ═══════════════════════════════════════════════════════════════
// 슬라이드 생성 시작
// ═══════════════════════════════════════════════════════════════
let s = 1;

// ─── 슬라이드 1: 메인 커버 ──────────────────────────────────
{
  const slide = pres.addSlide();
  bg(slide);

  // 우측 이미지
  try {
    slide.addImage({
      path: IMG("cover_main"),
      x: 4.2, y: 0, w: 5.8, h: H,
      sizing: { type: "cover", w: 5.8, h: H },
      transparency: 25
    });
  } catch(e) {}

  // 좌측 다크 영역
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 6, h: H, fill: { color: C.bg, transparency: 0 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.06, fill: { color: C.accent }
  });

  label(slide, "프리미어 프로 실전 과정", 0.6, 0.65);
  slide.addText("12주차", {
    x: 0.6, y: 1.0, w: 5.5, h: 0.55,
    fontFace: FONT, fontSize: 15, color: C.muted, margin: 0
  });
  slide.addText("영상 편집\n심화 마스터", {
    x: 0.6, y: 1.6, w: 5.5, h: 2.2,
    fontFace: FONT, fontSize: 48, bold: true, color: C.white,
    margin: 0, lineSpacingMultiple: 1.1
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.95, w: 2.0, h: 0.045, fill: { color: C.accent }
  });

  slide.addText("키프레임  ·  사운드 디자인  ·  색보정 & PIP  ·  AI 워크플로우", {
    x: 0.6, y: 4.18, w: 5.5, h: 0.45,
    fontFace: FONT, fontSize: 11, color: C.muted, margin: 0
  });
  slideNum(slide, s++);
}

// ─── 슬라이드 2: 12주차 전체 목차 ────────────────────────────
{
  const slide = pres.addSlide();
  bg(slide);

  try {
    slide.addImage({
      path: IMG("cover_edit"),
      x: 6.2, y: 0, w: 3.8, h: H,
      sizing: { type: "cover", w: 3.8, h: H },
      transparency: 45
    });
  } catch(e) {}
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.2, y: 0, w: 3.8, h: H, fill: { color: C.bg, transparency: 35 }
  });

  accentBar(slide);
  label(slide, "12주차 강의 구성", 0.5, 0.48);
  slide.addText("이번 주차에서 배울 내용", {
    x: 0.5, y: 0.82, w: 5.5, h: 0.62,
    fontFace: FONT, fontSize: 24, bold: true, color: C.white, margin: 0
  });
  divider(slide, 1.55);

  const lectures = [
    { num: "1강", title: "키프레임 & 속도 조절", keys: "줌인/아웃 · 팝업 · Speed Ramp", time: "20분" },
    { num: "2강", title: "사운드 디자인",        keys: "노이즈 제거 · Ducking · SFX",    time: "18분" },
    { num: "3강", title: "색보정 & PIP",         keys: "Lumetri · LUT · 화면 속 화면",  time: "20분" },
    { num: "4강", title: "자동화·AI·워크플로우",  keys: "프리셋 · mogrt · AI · 루틴",    time: "20분" },
  ];
  lectures.forEach((lec, i) => {
    const y = 1.72 + i * 0.94;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y, w: 5.5, h: 0.8, fill: { color: i % 2 === 0 ? C.surface : C.bg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y, w: 0.06, h: 0.8, fill: { color: C.accent }
    });
    slide.addText(lec.num, {
      x: 0.65, y: y + 0.06, w: 0.65, h: 0.32,
      fontFace: FONT, fontSize: 10, bold: true, color: C.accent, margin: 0
    });
    slide.addText(lec.title, {
      x: 1.4, y: y + 0.07, w: 3.5, h: 0.32,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white, margin: 0
    });
    slide.addText(lec.keys, {
      x: 1.4, y: y + 0.44, w: 3.8, h: 0.28,
      fontFace: FONT, fontSize: 9.5, color: C.muted, margin: 0
    });
    slide.addText(lec.time, {
      x: 5.0, y: y + 0.22, w: 0.8, h: 0.32,
      fontFace: FONT, fontSize: 11, color: C.muted, align: "right", margin: 0
    });
  });
  slideNum(slide, s++);
}

// ══════════════════════════════════════════════════════════════
// 1강: 키프레임 & 속도 조절  (슬라이드 3~20, 18장)
// ══════════════════════════════════════════════════════════════

// 3: 1강 커버
lectureCover("1", "키프레임 & 속도 조절", ["줌인/아웃", "팝업 애니메이션", "Speed Ramp"], "20분", s++, "keyframe2");

// 4: 1강 목차
tocSlide("1", "키프레임 & 속도 조절", [
  "키프레임이란? — 개념과 구조 이해",
  "이펙트 컨트롤 패널 인터페이스",
  "줌인/줌아웃 키프레임 실습",
  "팝업 애니메이션 — 스케일 + 불투명도",
  "Ease In/Out으로 자연스러운 움직임",
  "Speed Ramp — 속도 변화 기법",
  "Time Remapping & 속도 곡선 활용",
], s++, "keyframe1");

// 5: 키프레임 개념
contentSlide("1강 · 개념", "키프레임(Keyframe)이란?", [
  { main: "특정 시간 지점의 속성 값을 기록하는 마커", sub: "위치, 크기, 불투명도, 속도 등 모든 속성에 적용 가능" },
  { main: "두 키프레임 사이는 자동으로 보간(Interpolation)됨", sub: "프리미어 프로가 시작~끝 값을 계산해 움직임을 만듦" },
  { main: "이펙트 컨트롤 패널에서 시계 아이콘 클릭으로 활성화", sub: "활성화 후 타임라인 이동 → 값 변경 → 자동 키프레임 생성" },
  { main: "키프레임 = 영상 그래픽의 기본 언어", sub: "모션 그래픽, 전환 효과, 속도 변화 모두 키프레임 기반" },
], s++, "pp_effects_workspace");

// 6: 이펙트 컨트롤 패널
contentSlide("1강 · 인터페이스", "이펙트 컨트롤 패널 구조", [
  { main: "클립 선택 → 상단 메뉴: 창 → 이펙트 컨트롤 (Shift+5)", sub: "Motion 항목: Position, Scale, Rotation, Anchor Point" },
  { main: "시계 아이콘 클릭 시 해당 속성의 키프레임 기록 시작", sub: "마름모 모양 = 키프레임, 회색 = 비활성, 노랑 = 선택됨" },
  { main: "타임라인 미니 뷰: 패널 우측에 클립의 키프레임 타임라인 표시", sub: "좌우 화살표로 인접 키프레임으로 빠르게 이동 가능" },
  { main: "Add/Remove 버튼: 현재 시간에 키프레임 추가·삭제", sub: "Add = 다이아몬드+ / Remove = 다이아몬드-" },
], s++, "pp_effects_workspace");

// 7: 줌인/아웃 실습
stepsSlide("1강 · 실습", "줌인/아웃 키프레임 실습", [
  { title: "클립 선택 후 이펙트 컨트롤 열기 (Shift+5)", desc: "타임라인에서 클립 클릭" },
  { title: "재생헤드를 줌인 시작 지점으로 이동", desc: "Scale 시계 아이콘 클릭 → 키프레임 생성 (100%)" },
  { title: "재생헤드를 줌인 끝 지점으로 이동", desc: "Scale 값을 130~150%로 변경 → 두 번째 키프레임 생성" },
  { title: "줌아웃 시 세 번째 키프레임 추가", desc: "끝 지점에서 다시 100% 입력" },
  { title: "Ease In/Out 적용으로 부드럽게 마무리", desc: "키프레임 우클릭 → Ease In / Ease Out 선택" },
], s++, "pp_effects_workspace");

// 8: 팝업 애니메이션
contentSlide("1강 · 팝업", "팝업 애니메이션 — 스케일 + 불투명도", [
  { main: "팝업 = Scale 0% → 100% + Opacity 0% → 100%", sub: "두 속성을 동시에 키프레임 처리해 등장 효과 완성" },
  { main: "지속 시간: 보통 8~15프레임 (약 0.3~0.5초)", sub: "너무 짧으면 딱딱하게, 너무 길면 느리게 느껴짐" },
  { main: "Anchor Point 조정으로 팝업 기준점 변경", sub: "하단 기준 팝업 → Anchor Y값을 클립 하단으로 이동" },
  { main: "Overshoot: 110%까지 올렸다가 100%로 복귀", sub: "3단계 키프레임으로 탄성 있는 팝업 연출" },
], s++, "keyframe3");

// 9: Ease In/Out
contentSlide("1강 · 보간", "Ease In/Out — 자연스러운 움직임", [
  { main: "Linear: 일정한 속도, 기계적으로 보임 — 피할 것", sub: "키프레임 마름모 모양 = 선형 보간" },
  { main: "Ease In: 감속 종료 — 키프레임 도착 직전 속도 줄이기", sub: "멈추는 움직임에 사용 (슬라이드 정착, 클립 정지)" },
  { main: "Ease Out: 가속 시작 — 키프레임 출발 직후 속도 올리기", sub: "시작하는 움직임에 사용 (등장, 줌 시작)" },
  { main: "Bezier: 커브를 직접 조작해 완전한 커스터마이징", sub: "속도 그래프에서 핸들 드래그로 세밀한 제어" },
], s++, "keyframe4");

// 10: Speed Ramp 개념
contentSlide("1강 · Speed Ramp", "Speed Ramp — 영화 같은 속도 변화", [
  { main: "Speed Ramp = 클립 재생 속도를 점진적으로 변화시키는 기법", sub: "단순 슬로모션과 달리 자연스러운 속도 전환이 특징" },
  { main: "사용 상황: 액션 하이라이트, 드라마틱 강조, 전환 효과", sub: "빠른 속도 → 슬로우 → 다시 가속하는 패턴이 대표적" },
  { main: "적용 방법: 클립 우클릭 → 속도/지속 시간 (Ctrl+R)", sub: "또는 Time Remapping 효과 활용 (더 세밀한 제어)" },
  { main: "Time Remapping vs. 속도/지속 시간의 차이", sub: "속도/지속 시간 = 전체 일괄 / Time Remapping = 구간별 조절" },
], s++, "keyframe1");

// 11: Time Remapping 실습
stepsSlide("1강 · 실습", "Time Remapping 적용 단계", [
  { title: "클립 우클릭 → 표시 → 시간 다시 매핑 → 속도", desc: "클립 상단에 노란 속도 라인이 나타남" },
  { title: "Ctrl+클릭으로 속도 라인에 키프레임 추가", desc: "속도 변경 시작·종료 지점에 각각 키프레임 생성" },
  { title: "첫 번째 키프레임 드래그로 구간 속도 설정", desc: "위로 올리면 빠르게, 아래로 내리면 슬로우모션" },
  { title: "키프레임 중앙 핸들로 속도 전환 부드럽게", desc: "Bezier 핸들 좌우 조절로 S커브 완성" },
  { title: "오디오 클립 연결 해제 후 작업", desc: "클립 우클릭 → 연결 해제 → 비디오만 속도 적용" },
], s++, "keyframe2");

// 12: 속도 그래프
contentSlide("1강 · 고급", "속도 그래프에서 커브 직접 조작", [
  { main: "이펙트 컨트롤 → 속도 그래프 보기로 전환", sub: "상단 그래프 = 값 변화 / 하단 그래프 = 속도 변화" },
  { main: "속도 그래프 핸들: 완만한 S자 커브로 드래그", sub: "S자 커브 = 가속 후 감속, 가장 자연스러운 움직임" },
  { main: "급격한 변화 필요 시: 핸들 짧게 유지", sub: "핸들 길이 = 영향 범위, 짧을수록 변화 급격" },
  { main: "속도 피크 확인: 가장 빠른 지점이 시각적 포인트", sub: "편집 리듬과 맞추면 더 강렬한 효과 연출 가능" },
], s++, "pp_effects_workspace");

// 13: J컷 L컷
twoColSlide("1강 · J/L컷", "J컷 & L컷 + 속도 조절 결합",
  "J컷 (J-Cut)",
  ["다음 클립의 오디오가 먼저 시작", "영상은 이전 클립 유지", "음악/대화 시작 후 화면 전환", "부드러운 장면 연결에 효과적"],
  "L컷 (L-Cut)",
  ["이전 클립의 오디오가 계속 재생", "영상은 이미 다음 클립으로 전환", "반응 장면, 인터뷰에 자주 사용", "오디오 연속성 유지"],
s++, "keyframe4");

// 14: 자주 하는 실수
tipsSlide("1강 · 주의사항", "자주 하는 키프레임 실수 3가지", [
  { icon: "!", text: "시계 아이콘을 켜지 않고 값만 바꾸면 전체 클립에 적용됨 → 시계 먼저" },
  { icon: "!", text: "Anchor Point를 바꾸면 Position 좌표가 틀어짐 → Anchor 먼저 설정 후 키프레임" },
  { icon: "!", text: "클립 잘라낸 후 키프레임 위치가 밀릴 수 있음 → 잘라내기 전에 완성" },
  { icon: "✓", text: "팁: 키프레임 복사(Ctrl+C) 후 다른 클립에 붙여넣기로 반복 패턴 재사용" },
], s++, "keyframe1", C.red);

// 15: 단축키
shortcutSlide("1강 · 단축키", "키프레임 핵심 단축키", [
  { action: "이펙트 컨트롤 열기",   key: "Shift+5" },
  { action: "키프레임 (위치)",      key: "P" },
  { action: "키프레임 (크기)",      key: "S" },
  { action: "키프레임 (불투명도)", key: "T" },
  { action: "속도/지속 시간",       key: "Ctrl+R" },
  { action: "Ease In 적용",         key: "Shift+F9" },
  { action: "Ease Out 적용",        key: "F9" },
  { action: "다음 키프레임 이동",   key: "Shift+K" },
], s++, "code1");

// 16: Before/After
beforeAfterSlide("1강 · 비교", "줌인 적용 전후 비교",
  ["정적인 숏", "단조로운 화면 구성", "강조 포인트 없음", "시청자 주목도 낮음"],
  ["시선을 이끄는 줌인 효과", "자연스러운 Ease 곡선", "핵심 장면 집중 강조", "편집 리듬감 상승"],
  "Ease Out + 줌인 → 홀드 → Ease In + 줌아웃 순서가 가장 안정적",
s++, "keyframe2");

// 17: Speed Ramp 활용
statSlide("1강 · 활용", "Speed Ramp 실전 활용 패턴", [
  { value: "400%", label: "도입부 빠르게 — 지루함 제거" },
  { value: "20%",  label: "하이라이트 슬로우 — 감동 극대화" },
  { value: "100%", label: "일반 속도 — 내러티브 유지" },
  { value: "0.3초", label: "전환 구간 권장 길이" },
  { value: "8~12f", label: "팝업 애니메이션 최적 길이" },
  { value: "S커브", label: "속도 그래프 권장 형태" },
], s++, "keyframe3");

// 18: 키프레임 복사 재사용
contentSlide("1강 · 고급", "키프레임 복사 & 재사용 워크플로우", [
  { main: "여러 키프레임 선택(Ctrl+클릭) → Ctrl+C → 다른 클립 Ctrl+V", sub: "같은 움직임 패턴을 여러 클립에 즉시 복제" },
  { main: "이펙트 컨트롤 우클릭 → 프리셋 저장: 키프레임 세트 패키징", sub: "팀 공유 또는 다음 프로젝트 재사용" },
  { main: "중첩 시퀀스(Nest): 복잡한 키프레임 그룹을 하나의 클립으로 묶기", sub: "클립 선택 → 우클릭 → 중첩 → 전체에 Speed Ramp 한 번에 적용" },
  { main: "음악 비트에 속도 전환 포인트 맞추기", sub: "리듬감 있는 편집의 핵심 — 타임라인 마커(M) 활용" },
], s++, "keyframe4");

// 19: Speed Ramp 실전 팁
tipsSlide("1강 · 실전 팁", "Speed Ramp + Ease 결합 — 실전 패턴", [
  { icon: "1", text: "도입부: Ease Out(가속) → 빠른 액션 구간 → Ease In(감속) → 슬로우" },
  { icon: "2", text: "하이라이트 전: 20% 슬로우 → 포인트 장면 → 400% 가속 → 다음 장면" },
  { icon: "3", text: "음악 비트에 속도 전환 포인트 맞추기 — 리듬감 있는 편집의 핵심" },
  { icon: "✓", text: "속도 변화 전후 0.5초는 반드시 Ease 적용 — 급격한 전환 방지" },
], s++, "keyframe1");

// 20: 1강 요약
summarySlide("1강 · 정리", "1강 핵심 요약", [
  { title: "키프레임 기본 원리", desc: "시계 아이콘 → 시간 이동 → 값 변경으로 움직임 생성" },
  { title: "줌인/아웃",          desc: "Scale 키프레임 + Ease In/Out으로 자연스러운 카메라 효과" },
  { title: "팝업 애니메이션",    desc: "Scale + Opacity 동시 적용, 8~15프레임이 최적" },
  { title: "Speed Ramp",         desc: "Time Remapping으로 구간별 속도 제어, S커브 권장" },
], s++, "keyframe2");

// ══════════════════════════════════════════════════════════════
// 2강: 사운드 디자인  (슬라이드 21~37, 17장)
// ══════════════════════════════════════════════════════════════

// 21: 2강 커버
lectureCover("2", "사운드 디자인", ["노이즈 제거", "BGM Ducking", "SFX"], "18분", s++, "audio4");

// 22: 2강 목차
tocSlide("2", "사운드 디자인", [
  "오디오 트랙 구조 이해",
  "노이즈 제거 — Audition 연동 & DeNoise",
  "BGM Ducking — Essential Sound 활용",
  "SFX 삽입 & 레이어링",
  "오디오 레벨 믹싱 기준",
  "마스터 채널 & 오디오 전환",
  "무료 SFX 소스 & 오디오 QA",
], s++, "audio1");

// 23: 오디오 트랙 구조
contentSlide("2강 · 구조", "오디오 트랙 레이어 구조", [
  { main: "A1: 메인 보이스 오버 / 나레이션 트랙 (-12 ~ -6 dBFS)", sub: "가장 높은 레벨 유지, 청취자가 가장 잘 들려야 하는 소리" },
  { main: "A2: 환경음 / 앰비언스 트랙 (-30 ~ -20 dBFS)", sub: "배경 공간감 제공, 낮은 볼륨 유지" },
  { main: "A3: BGM 트랙 (-30 ~ -15 dBFS, Ducking 필수)", sub: "보이스 대비 -15 ~ -20 dB 낮게 설정" },
  { main: "A4 이하: SFX 효과음 트랙 (-18 ~ -12 dBFS)", sub: "장면별 분리 배치, 믹스 후 일괄 조정" },
], s++, "pp_audio_workspace");

// 24: 노이즈 제거 Audition
stepsSlide("2강 · 노이즈 제거", "Adobe Audition 연동 노이즈 제거", [
  { title: "오디오 클립 우클릭 → Adobe Audition에서 편집", desc: "Audition 자동 실행, 클립 열림" },
  { title: "노이즈만 있는 구간 드래그로 선택 (0.5~1초)", desc: "보통 강의 시작 전 무음 구간 활용" },
  { title: "효과 → 노이즈 감소/복원 → 노이즈 감소", desc: "노이즈 프린트 캡처 → 전체 클립에 적용" },
  { title: "감소량 슬라이더: 40~60% 권장", desc: "과도하면 음질 저하, 미리 듣기로 확인 후 적용" },
  { title: "저장(Ctrl+S) → 프리미어로 자동 반영", desc: "Audition에서 저장하면 프리미어 클립 자동 업데이트" },
], s++, "audio3");

// 25: DeNoise
stepsSlide("2강 · 노이즈 제거", "프리미어 프로 내장 DeNoise", [
  { title: "이펙트 패널 검색창에 'DeNoise' 입력", desc: "클립에 드래그하여 적용" },
  { title: "이펙트 컨트롤에서 Amount 조정 (40~60%)", desc: "100%로 올리면 소리가 부자연스러워짐" },
  { title: "FFT Size: 128~256 권장 (실시간 미리보기 기준)", desc: "높을수록 정교하지만 처리 속도 느림" },
  { title: "Audition 연동이 불가할 때 대안으로 사용", desc: "간단한 노이즈에 효과적, 복잡한 소음엔 Audition 권장" },
], s++, "audio1");

// 26: BGM Ducking 개념
contentSlide("2강 · Ducking", "BGM Ducking — 자동 볼륨 조절", [
  { main: "Ducking = 보이스 오버 구간에서 BGM을 자동으로 낮추는 기법", sub: "방송·유튜브 영상의 전문성을 높이는 핵심 기술" },
  { main: "수동 방법: 키프레임으로 BGM 볼륨 일일이 조절", sub: "시간이 오래 걸리지만 가장 정밀한 제어 가능" },
  { main: "자동 방법: Essential Sound 패널의 Auto Ducking", sub: "AI가 대화 구간을 감지해 BGM을 자동으로 조절" },
  { main: "목표 볼륨 차이: 보이스 -12 dB, BGM -30 dB (약 -18 dB 차이)", sub: "너무 크면 BGM이 뚝 끊기는 느낌" },
], s++, "pp_essential_sound_zoom");

// 27: BGM Ducking 실습
stepsSlide("2강 · 실습", "Essential Sound Auto Ducking 실습", [
  { title: "창 → Essential Sound 패널 열기", desc: "대화·음악·효과음·앰비언스 4개 카테고리" },
  { title: "보이스 클립 선택 → [대화] 탭 → 대화로 표시", desc: "AI가 이 클립을 기준으로 Ducking 적용" },
  { title: "BGM 클립 선택 → [음악] 탭 → 음악으로 표시", desc: "Ducking 체크박스 활성화" },
  { title: "대화를 기반으로 Ducking 설정", desc: "Duck Amount(-12~-20 dB)와 Fade 시간 설정" },
  { title: "클립에 키프레임 생성 버튼 클릭 → 자동 적용", desc: "볼륨 키프레임이 자동으로 생성됨" },
], s++, "pp_essential_sound_zoom");

// 28: SFX 개념
contentSlide("2강 · SFX", "SFX — 사운드 이펙트 종류와 역할", [
  { main: "UI/전환음: 클릭, 슬라이드, 팝업 인터페이스 소리", sub: "온라인 강의·교육 영상에서 집중도 향상에 효과적" },
  { main: "앰비언스: 공간감을 부여하는 배경 환경음", sub: "실내 공기, 카페 소음, 야외 바람 등" },
  { main: "임팩트 사운드: 텍스트 등장, 강조 장면에 사용", sub: "드럼 타격음, 펑 소리, 상승/하강 사운드 등" },
  { main: "폴리 사운드: 특정 동작에 맞는 현실적 효과음", sub: "발소리, 키보드 소리, 물 소리 등 현장감 강화" },
], s++, "audio3");

// 29: SFX 삽입 실습
stepsSlide("2강 · 실습", "SFX 삽입 & 레이어링 실습", [
  { title: "SFX 파일(WAV/MP3)을 프로젝트 패널로 임포트", desc: "별도 SFX 폴더로 구분 관리 권장" },
  { title: "SFX 전용 오디오 트랙(A4~) 생성 및 배치", desc: "타임라인 빈 공간 우클릭 → 오디오 트랙 추가" },
  { title: "영상의 해당 동작 지점에 SFX 클립 배치", desc: "파형 확인하며 정확한 싱크 맞추기" },
  { title: "볼륨 조절: SFX는 보통 -18 ~ -12 dBFS", desc: "너무 크면 거슬림, 너무 작으면 효과 없음" },
  { title: "페이드 인/아웃: 클립 모서리 드래그", desc: "갑작스러운 시작/종료 방지, 자연스러운 블렌딩" },
], s++, "audio5");

// 30: 오디오 레벨 기준
statSlide("2강 · 믹싱", "오디오 레벨 표준 기준값", [
  { value: "-12 dB",   label: "보이스 오버 권장 레벨" },
  { value: "-30 dB",   label: "BGM 기본 레벨" },
  { value: "-18 dB",   label: "SFX 효과음 평균" },
  { value: "-1 dB",    label: "마스터 채널 최대값" },
  { value: "-23 LUFS", label: "유튜브 적정 음량 기준" },
  { value: "3:1",      label: "보이스:BGM 권장 비율" },
], s++, "audio4");

// 31: 마스터 채널
contentSlide("2강 · 마스터", "마스터 채널 & 오디오 미터 활용", [
  { main: "오디오 미터: 창 → 오디오 미터 활성화 (Ctrl+4)", sub: "편집 중 항상 켜두고 피크 레벨 모니터링" },
  { main: "오디오 트랙 믹서: 창 → 오디오 트랙 믹서 (Shift+9)", sub: "각 트랙의 볼륨·팬 실시간 조정, 마스터 채널 확인" },
  { main: "마스터 채널 볼륨: -1 dBFS 이하로 유지 (클리핑 방지)", sub: "피크 표시가 빨간색으로 켜지면 볼륨 낮춰야 함" },
  { main: "Loudness 정규화: -14 LUFS (유튜브) / -23 LUFS (방송)", sub: "시퀀스 → 오디오 → Loudness 정규화 메뉴 활용" },
], s++, "pp_audio_workspace");

// 32: 오디오 전환
twoColSlide("2강 · 오디오 전환", "Constant Power vs. Constant Gain",
  "Constant Power (기본값)",
  ["에너지 일정하게 유지", "음악·앰비언스 전환에 적합", "크로스페이드 표준 방식", "중간 지점에서 볼륨 살짝 올라감"],
  "Constant Gain",
  ["볼륨 선형적 변화", "인터뷰·대화 전환에 적합", "중간 지점에서 살짝 낮아짐", "더 자연스러운 대화 느낌"],
s++, "audio2");

// 33: 무료 SFX 소스
contentSlide("2강 · 리소스", "무료 SFX 소스 추천", [
  { main: "Pixabay Sound Effects — 상업적 이용 가능, 무제한", sub: "pixabay.com/sound-effects에서 키워드 검색" },
  { main: "Freesound.org — 방대한 CC 라이선스 사운드 라이브러리", sub: "다운로드 시 라이선스 확인 필수 (CC0 선택 권장)" },
  { main: "Adobe Audition 내장 SFX 팩", sub: "File → Browse Adobe Stock → Sound Effects 탭" },
  { main: "YouTube Audio Library — 배경음·효과음 무료 제공", sub: "studio.youtube.com → 오디오 라이브러리 메뉴" },
], s++, "audio3");

// 34: 오디오 파형 분석
contentSlide("2강 · 분석", "오디오 파형으로 믹싱 상태 읽기", [
  { main: "파형이 꽉 찬 경우: 클리핑 가능성 — 볼륨 낮추기", sub: "빨간 피크 표시 = 클리핑 발생, 즉시 조치 필요" },
  { main: "파형이 너무 얇은 경우: 볼륨 부족 — Amplify 또는 Normalize로 올리기", sub: "이펙트 → 오디오 이펙트 → Amplify 적용" },
  { main: "파형 형태로 구간 파악: 돌출 = 큰 소리, 평탄 = 낮은 구간", sub: "타임라인에서 클립 높이 늘려 파형 확대 보기 가능" },
  { main: "스테레오 vs 모노: 채널 불균형 시 한쪽만 소리", sub: "오디오 미터에서 좌우 채널 균형 확인 필수" },
], s++, "audio4");

// 35: 서브믹스
stepsSlide("2강 · 서브믹스", "서브믹스 트랙으로 효율적 믹싱", [
  { title: "오디오 트랙 믹서에서 서브믹스 트랙 추가", desc: "하단 + 버튼 → 오디오 서브믹스 트랙 → 스테레오 선택" },
  { title: "각 트랙의 출력을 서브믹스로 연결", desc: "트랙 믹서에서 출력 드롭다운 → 서브믹스 트랙 선택" },
  { title: "SFX 트랙들 → SFX 서브믹스로 묶기", desc: "SFX 전체 볼륨을 서브믹스 페이더 하나로 일괄 조정" },
  { title: "서브믹스에 EQ/컴프레서 한 번만 적용", desc: "모든 SFX 클립에 개별 적용 대신 서브믹스에서 통합" },
  { title: "마스터 채널에서 최종 레벨 확인", desc: "서브믹스 → 마스터 구조로 체계적 레벨 관리" },
], s++, "audio5");

// 36: 오디오 QA
tipsSlide("2강 · QA", "출력 전 오디오 QA 체크리스트", [
  { icon: "✓", text: "보이스 레벨 -12 dBFS 이하 확인 (오디오 미터)" },
  { icon: "✓", text: "마스터 채널 피크 클리핑 없음 (빨간 표시 없음)" },
  { icon: "✓", text: "BGM Ducking — 대화 구간에서 BGM이 충분히 낮아지는지" },
  { icon: "✓", text: "무음 구간 없음 — 편집 컷 사이 오디오 끊기지 않음" },
  { icon: "✓", text: "오디오 전환(크로스페이드) 적용 여부 확인" },
], s++, "audio1");

// 37: 2강 요약
summarySlide("2강 · 정리", "2강 핵심 요약", [
  { title: "노이즈 제거",  desc: "Audition 연동 또는 내장 DeNoise 효과로 배경 노이즈 제거" },
  { title: "BGM Ducking", desc: "Essential Sound Auto Ducking으로 보이스 구간 자동 볼륨 조절" },
  { title: "SFX 활용",    desc: "UI음·임팩트·앰비언스 레이어링으로 영상 몰입감 향상" },
  { title: "믹싱 기준",   desc: "보이스 -12 dB / BGM -30 dB / 마스터 -1 dBFS 이하" },
], s++, "audio3");

// ══════════════════════════════════════════════════════════════
// 3강: 색보정 & PIP  (슬라이드 38~54, 17장)
// ══════════════════════════════════════════════════════════════

// 38: 3강 커버
lectureCover("3", "색보정 & PIP", ["Lumetri 3분 공식", "LUT 활용", "화면 속 화면"], "20분", s++, "color2");

// 39: 3강 목차
tocSlide("3", "색보정 & PIP", [
  "색보정이 필요한 이유",
  "Lumetri Color 패널 구조",
  "Lumetri 3분 공식 — 3단계 색보정",
  "LUT 적용 & 강도 조절",
  "Lumetri Scopes — 정확한 색보정의 기준",
  "PIP(화면 속 화면) 기본 설정",
  "색보정 + PIP 결합 실전",
], s++, "color1");

// 40: 색보정이 필요한 이유
contentSlide("3강 · 개념", "색보정이 영상 품질을 결정한다", [
  { main: "카메라는 실제 눈보다 색을 평탄하게 기록함", sub: "Log·Flat 프로파일 촬영 시 후보정이 필수 과정" },
  { main: "색보정 = 시청자의 감정에 직접적 영향", sub: "따뜻한 톤 → 친밀감 / 차가운 톤 → 긴장감·전문성" },
  { main: "1차 색보정(Primary): 노출·화이트밸런스·대비 교정", sub: "기술적 문제 수정이 목적 — 정확성이 우선" },
  { main: "2차 색보정(Secondary): 특정 색상·영역 선택적 조정", sub: "특정 피부색 보정, 하늘 강조 등 창의적 표현" },
], s++, "color3");

// 41: Lumetri Color 패널
contentSlide("3강 · 패널", "Lumetri Color 패널 구조", [
  { main: "기본 교정 (Basic Correction): 노출·흰점·검정점·채도", sub: "가장 먼저 작업하는 섹션 — 색 교정의 기초" },
  { main: "크리에이티브 (Creative): LUT 적용, 채도·활기 조절", sub: "Look 드롭다운에서 프리셋 LUT 미리보기 가능" },
  { main: "커브 (Curves): 정밀한 밝기·색상 채널별 조정", sub: "S커브 = 대비 향상, 채널 조정 = 컬러 그레이딩" },
  { main: "색조/채도 (Hue/Saturation): 특정 색상만 선택 조정", sub: "피부 색조 보정, 하늘·나뭇잎 색 강조에 유용" },
], s++, "pp_color_workspace");

// 42: Lumetri 3분 공식 1단계
stepsSlide("3강 · 공식", "Lumetri 3분 공식 — 1단계: 기본 교정 (1분)", [
  { title: "화이트밸런스: WB 선택기 스포이드 → 흰 물체 클릭", desc: "중성 회색/흰색 영역을 기준으로 자동 보정" },
  { title: "노출(Exposure): 화면이 적절히 밝아질 때까지 조정", desc: "히스토그램 양 끝이 잘리지 않는 범위 내에서" },
  { title: "대비(Contrast): +20~+40 적용으로 선명도 향상", desc: "너무 높이면 디테일 손실 — 미디엄 톤 기준 조정" },
  { title: "흰점(Highlight) 살짝 낮추고, 검정점(Shadow) 살짝 올리기", desc: "클리핑 방지 + 부드러운 다이나믹 레인지 확보" },
], s++, "pp_color_workspace");

// 43: Lumetri 3분 공식 2단계
stepsSlide("3강 · 공식", "Lumetri 3분 공식 — 2단계: 색상 표현 (1분)", [
  { title: "채도(Saturation): 110~120 권장 (100이 원본)", desc: "130 이상이면 과포화로 인위적으로 보임" },
  { title: "활기(Vibrance): 저채도 색만 선택적으로 향상", desc: "피부색 자연스럽게 유지하면서 배경·의상 색 강조" },
  { title: "색조(Tint): 녹색/마젠타 색조 미세 조정", desc: "형광등 환경 촬영 시 녹색 편향 보정에 유용" },
  { title: "색온도(Temperature): 차갑게/따뜻하게 분위기 조정", desc: "교육 영상 → 중성~약간 따뜻하게 (5500~6000K)" },
], s++, "pp_color_workspace");

// 44: Lumetri 3분 공식 3단계
stepsSlide("3강 · 공식", "Lumetri 3분 공식 — 3단계: 창의적 색감 (1분)", [
  { title: "크리에이티브 탭 → Look → 프리셋 선택", desc: "SL Blue Sunset, Cinematic 등 다양한 무드 프리셋" },
  { title: "강도(Intensity) 슬라이더: 30~60% 권장", desc: "100%는 과도한 컬러 그레이딩으로 부자연스러움" },
  { title: "섀도 틴트/하이라이트 틴트 미세 조정", desc: "어두운 부분=파랗게, 밝은 부분=따뜻하게 → 영화적 효과" },
  { title: "최종 채도 미세 조정으로 마무리", desc: "전체적으로 시청하며 균형 확인 후 완성" },
], s++, "pp_color_workspace");

// 45: LUT 개념
contentSlide("3강 · LUT", "LUT(Look-Up Table)란?", [
  { main: "LUT = 색상 변환 수식을 담은 파일 (.cube / .3dl)", sub: "특정 색상 → 새로운 색상으로 매핑하는 색보정 테이블" },
  { main: "Technical LUT: 카메라 Log 프로파일 → 정상 색상 변환", sub: "Sony S-Log, Canon Log 등 촬영 시 필수 교정용" },
  { main: "Creative LUT: 영화·시네마틱 스타일의 컬러 그레이딩", sub: "Orange & Teal, Film Emulation 등 무드 연출용" },
  { main: "LUT 선적용 후 미세 조정이 전문가 워크플로우", sub: "LUT → Lumetri 기본 교정 순서로 섬세하게 완성" },
], s++, "color2");

// 46: LUT 실습
stepsSlide("3강 · 실습", "LUT 적용 & 강도 조절", [
  { title: "Lumetri Color → 기본 교정 → 입력 LUT 클릭", desc: "Technical LUT 적용 (Log 보정용)" },
  { title: "크리에이티브 탭 → Look → Browse → .cube 파일 선택", desc: "Creative LUT 적용 (무드 연출용)" },
  { title: "강도(Intensity) 슬라이더: 50% 기준으로 시작", desc: "100%는 LUT 그대로, 낮출수록 원본과 블렌딩" },
  { title: "Lumetri 기본 교정에서 노출·채도 미세 조정", desc: "LUT 적용 후 밝기·색감 최종 확인 및 보완" },
  { title: "조정 레이어(Adjustment Layer)로 전체 통일감", desc: "프로젝트 패널 → 새 항목 → 조정 레이어 → 타임라인 배치" },
], s++, "pp_color_workspace");

// 47: Lumetri Scopes
contentSlide("3강 · 도구", "Lumetri Scopes — 정확한 색보정의 기준", [
  { main: "Scopes 열기: 창 → Lumetri 범위 (Ctrl+Shift+I)", sub: "색보정의 '자'와 같은 도구 — 눈이 아닌 데이터로 판단" },
  { main: "벡터스코프(Vectorscope): 색상과 채도 분포 확인", sub: "중앙에 가까울수록 무채색, 바깥쪽일수록 채도 높음" },
  { main: "웨이브폼(Waveform): 밝기 레벨 분포 확인", sub: "0~100% 내 유지 — 클리핑 없는 노출 범위 체크" },
  { main: "히스토그램: 전체 밝기 분포를 산 모양으로 표시", sub: "좌편향=노출 부족, 우편향=과노출, 중앙 봉우리=정상" },
], s++, "pp_color_workspace");

// 48: PIP 개념
contentSlide("3강 · PIP", "PIP(Picture in Picture) — 화면 속 화면", [
  { main: "PIP = 영상 위에 또 다른 영상/이미지를 겹쳐 표시", sub: "강의 영상의 강사 얼굴, 화면 녹화 위 웹캠 삽입 등" },
  { main: "V2~V3 트랙에 PIP 클립 배치 후 Scale/Position 조정", sub: "V1=배경, V2=PIP 순으로 상위 트랙이 앞에 표시됨" },
  { main: "일반적인 PIP 크기: 화면의 20~30% (약 25~30% Scale)", sub: "너무 크면 배경 가리고, 너무 작으면 인식 어려움" },
  { main: "위치: 우하단이 가장 일반적, 자막 위치와 겹치지 않도록", sub: "콘텐츠 방해 최소화가 PIP 배치의 핵심 원칙" },
], s++, "color4");

// 49: PIP 실습
stepsSlide("3강 · 실습", "PIP 기본 설정 실습", [
  { title: "PIP 클립을 V2 트랙에 배치", desc: "드래그 앤 드롭 또는 Insert/Overwrite로 배치" },
  { title: "클립 선택 → 이펙트 컨트롤 → Scale 조정 (25~30%)", desc: "비율 고정(Uniform Scale) 체크 후 조정" },
  { title: "Position으로 화면 우하단 배치", desc: "X: 800~850, Y: 400~450 (1920×1080 기준)" },
  { title: "Crop 효과 → 불필요한 영역 잘라내기", desc: "이펙트 패널: Transform → Crop 적용" },
  { title: "Stroke 효과로 외곽선 추가 (굵기 4~8px)", desc: "흰색 또는 강조색으로 경계 명확화" },
], s++, "color2");

// 50: 색보정 Before/After
beforeAfterSlide("3강 · 비교", "Lumetri 3분 공식 적용 전후",
  ["평탄한 색감 (Log/Flat)", "낮은 대비, 흐린 피부색", "화이트밸런스 불균형", "시청자 이탈률 높음"],
  ["생동감 있는 자연스러운 색감", "적절한 대비 + 피부톤 정확성", "중성 화이트밸런스 기준점", "집중도 높은 전문 영상 품질"],
  "색보정 비교는 항상 fx 버튼으로 ON/OFF 전환하며 체크",
s++, "color1");

// 51: 다중 PIP 레이아웃
statSlide("3강 · 활용", "다중 PIP 화면 분할 레이아웃 패턴", [
  { value: "2분할",  label: "좌우 50:50 — 비교·대결 장면" },
  { value: "3분할",  label: "좌1+우2 — 반응 영상 포맷" },
  { value: "PIP",    label: "메인+소형 삽입 — 강의·튜토리얼" },
  { value: "L자형",  label: "메인+하단 자막 영역 분리" },
  { value: "그리드", label: "4분할 — 동시 비교 분석" },
  { value: "오버레이", label: "투명도 적용 PIP — 자연스러운 합성" },
], s++, "color3");

// 52: 색보정 PIP 결합
contentSlide("3강 · 실전", "색보정 + PIP 결합 실전 워크플로우", [
  { main: "V1 배경 영상 색보정 완료 후 PIP 작업 시작", sub: "순서가 반대가 되면 색보정 조정 시 PIP 위치 흐트러짐" },
  { main: "조정 레이어를 V3 트랙에 배치하면 V1+V2 모두 적용", sub: "PIP와 배경에 동일한 색보정 적용 → 통일된 색감" },
  { main: "PIP 클립에 별도 Lumetri 적용으로 독립 색보정 가능", sub: "웹캠 PIP와 화면 녹화 배경의 색온도 차이 보정" },
  { main: "키프레임으로 PIP 등장/퇴장 애니메이션 추가", sub: "Scale 0→100 (등장) + 이동 경로로 전문적인 연출" },
], s++, "color4");

// 53: 색보정 주의사항
tipsSlide("3강 · 주의", "색보정 작업 시 자주 하는 실수", [
  { icon: "!", text: "LUT 강도를 100%로 사용 — 항상 40~60%로 낮추고 미세 조정" },
  { icon: "!", text: "히스토그램을 보지 않고 직감으로 조정 — 클리핑 발생 주의" },
  { icon: "!", text: "모니터 색 프로파일이 다르면 다른 환경에서 색이 달리 보임" },
  { icon: "✓", text: "Lumetri 효과 비교: 이펙트 컨트롤 fx 버튼으로 ON/OFF 확인" },
  { icon: "✓", text: "조정 레이어 활용으로 여러 클립 일괄 색보정 시간 절약" },
], s++, "color2", C.red);

// 54: 3강 요약
summarySlide("3강 · 정리", "3강 핵심 요약", [
  { title: "Lumetri 3분 공식", desc: "기본 교정 1분 → 색상 표현 1분 → 창의적 색감 1분" },
  { title: "LUT 활용",         desc: "Technical LUT로 Log 보정 후 Creative LUT로 무드 연출" },
  { title: "Lumetri Scopes",   desc: "벡터스코프·웨이브폼·히스토그램으로 데이터 기반 색보정" },
  { title: "PIP 기본 설정",    desc: "V2 트랙 배치 → Scale 25~30% → Position 우하단 → 외곽선" },
], s++, "color1");

// ══════════════════════════════════════════════════════════════
// 4강: 자동화·AI·워크플로우  (슬라이드 55~70, 16장)
// ══════════════════════════════════════════════════════════════

// 55: 4강 커버
lectureCover("4", "자동화·AI·워크플로우", ["프리셋 & mogrt", "AI 도구 활용", "편집 루틴 시스템"], "20분", s++, "ai3");

// 56: 4강 목차
tocSlide("4", "자동화·AI·워크플로우", [
  "프리셋 만들기 & 불러오기",
  "mogrt(모션 그래픽 템플릿) 활용",
  "프리미어 프로 AI 기능 개요",
  "AI 자동 리프레이밍 & 자막 생성",
  "외부 AI 도구 연동 (Runway, Topaz)",
  "편집 루틴 — 반복 작업 시스템화",
  "프로젝트 정리 & 아카이빙",
], s++, "ai1");

// 57: 프리셋 만들기
stepsSlide("4강 · 프리셋", "이펙트 프리셋 만들기 & 저장", [
  { title: "자주 쓰는 이펙트 조합을 클립에 적용 후 완성", desc: "예: DeNoise + EQ + Compression 조합" },
  { title: "이펙트 컨트롤에서 효과 선택 (Ctrl+클릭으로 다중)", desc: "프리셋으로 저장할 효과만 선택" },
  { title: "우클릭 → 프리셋 저장 → 이름·카테고리 설정", desc: "나만의 카테고리 폴더 만들어 체계적으로 관리" },
  { title: "이펙트 패널 → 프리셋 폴더에서 불러오기", desc: "드래그 앤 드롭으로 원하는 클립에 즉시 적용" },
  { title: "Export Presets로 팀원·다른 컴퓨터에 공유", desc: "이펙트 패널 우측 메뉴 → 사전 설정 내보내기" },
], s++, "code1");

// 58: mogrt 개념
contentSlide("4강 · mogrt", "mogrt — 모션 그래픽 템플릿", [
  { main: "mogrt = Motion Graphics Template, 수정 가능한 애니메이션 자막 템플릿", sub: "After Effects 제작 또는 Adobe Stock 다운로드" },
  { main: "텍스트·색상·폰트만 수정하면 전문적인 자막 완성", sub: "AE 실력 없이도 고품질 그래픽 사용 가능" },
  { main: "Essential Graphics 패널에서 관리: 창 → 필수 그래픽", sub: "로컬·CC 라이브러리·Stock 항목 모두 탐색 가능" },
  { main: "자주 쓰는 하단 자막 mogrt는 마스터 클립으로 저장", sub: "매번 설정 반복 없이 클립 복제로 일관된 디자인 유지" },
], s++, "pp_essential_graphics_zoom");

// 59: mogrt 실습
stepsSlide("4강 · 실습", "mogrt 설치 & 사용 실습", [
  { title: "Essential Graphics 패널 열기: 창 → 필수 그래픽", desc: "탐색 탭에서 Stock 검색 또는 로컬 파일 탐색" },
  { title: ".mogrt 파일 더블클릭 또는 드래그로 설치", desc: "패널 하단 + 버튼 → 파일 선택으로 직접 설치" },
  { title: "설치된 mogrt를 타임라인으로 드래그 배치", desc: "자동으로 그래픽 레이어(GFX) 트랙에 배치됨" },
  { title: "편집 탭 전환 → 텍스트·색상·폰트 직접 수정", desc: "수정 가능 항목이 패널에 표시됨" },
  { title: "마스터 클립 만든 후 Alt+드래그로 복제", desc: "배치 간격·타이밍 조정 후 전체 통일화" },
], s++, "pp_essential_graphics_zoom");

// 60: AI 기능 개요
contentSlide("4강 · AI", "프리미어 프로 내장 AI 기능 개요", [
  { main: "Auto Reframe: AI가 주요 피사체 추적·프레임 자동 조정", sub: "16:9 영상 → 9:16(쇼츠), 1:1(인스타) 자동 변환" },
  { main: "Speech to Text: AI 자동 자막 생성 (한국어 지원)", sub: "약 85~90% 정확도 — 반드시 교정 필요" },
  { main: "Scene Edit Detection: AI가 컷 지점을 자동 감지", sub: "원본 파일에서 편집점 자동 분석" },
  { main: "Enhanced Speech: AI 노이즈 제거 + 음성 선명도 향상", sub: "Essential Sound 패널 내 AI 탭에서 원클릭 적용" },
], s++, "pp_text_workspace");

// 61: Auto Reframe Before/After
beforeAfterSlide("4강 · AI 리프레이밍", "Auto Reframe — AI 자동 리프레이밍",
  ["수동으로 모든 클립 크롭·Position 조정", "클립별 수십 개 키프레임 작업", "피사체 움직임 추적 불가능", "쇼츠/릴스 제작 시 수 시간 소요"],
  ["AI가 주요 피사체 자동 추적", "클립 전체 움직임 추적 키프레임 자동 생성", "9:16·1:1·4:5 등 원클릭 변환", "수 시간 → 수 분으로 단축"],
  "시퀀스 → 자동 리프레이밍 시퀀스 → 비율 선택 → 분석 (Ctrl+Alt+A)",
s++, "ai3");

// 62: AI 자막 생성
stepsSlide("4강 · AI 자막", "Speech to Text AI 자막 생성", [
  { title: "텍스트 패널 열기: 창 → 텍스트 (Ctrl+Shift+T)", desc: "전사 탭에서 자막 생성·편집 가능" },
  { title: "전사 탭 → 시퀀스 전사 → 언어: 한국어 선택", desc: "분석 시간: 10분 영상 기준 약 1~3분" },
  { title: "전사 완료 후 오류 교정 — 전사 텍스트 직접 클릭 수정", desc: "클릭 시 해당 구간으로 타임라인 자동 이동" },
  { title: "자막 만들기 → mogrt 스타일 선택 또는 커스터마이징", desc: "자막 트랙에 자동 배치, 타이밍 자동 싱크" },
  { title: "SRT 파일로 내보내기: 파일 → 내보내기 → SRT", desc: "유튜브 자막 업로드용" },
], s++, "pp_text_workspace");

// 63: 외부 AI 도구
twoColSlide("4강 · 외부 AI", "외부 AI 도구 연동 — Runway & Topaz",
  "Runway ML",
  ["생성 AI 영상 편집 플랫폼", "배경 제거·교체 AI", "Gen-2 영상 생성 기능", "Adobe 플러그인으로 연동"],
  "Topaz Video AI",
  ["AI 기반 업스케일링 (4K→8K)", "슬로우모션 AI 프레임 보간", "노이즈 제거 전문 AI", "배치 처리로 대량 파일 처리"],
s++, "ai1");

// 64: 편집 루틴
contentSlide("4강 · 워크플로우", "반복 편집 작업 시스템화 — 루틴 설계", [
  { main: "1단계 — 소재 정리: 촬영 당일 임포트 + 폴더 분류", sub: "RAW / BGM / SFX / LUT / Template 5개 폴더 구조 고정" },
  { main: "2단계 — 러프컷: 오디오 파형 기준 빠른 컷 편집", sub: "Q/W 단축키 활용, 소리만으로 컷 결정" },
  { main: "3단계 — 파인컷: B롤 삽입 + 색보정 + 자막 추가", sub: "프리셋·mogrt 활용으로 반복 작업 최소화" },
  { main: "4단계 — QA + 출력: 오디오 체크 → Export → 업로드", sub: "H.264 / 4K / 25fps 표준 프리셋 저장해두고 재사용" },
], s++, "workflow2");

// 65: 프로젝트 정리
stepsSlide("4강 · 정리", "프로젝트 정리 & 아카이빙", [
  { title: "사용 소재 통합: 파일 → 프로젝트 관리자 → 파일 수집 및 복사", desc: "외부 드라이브 파일까지 한 폴더로 통합 보관" },
  { title: "미사용 소재 제거: 편집 → 미사용 항목 제거", desc: "불필요한 링크 제거로 프로젝트 파일 경량화" },
  { title: "시퀀스별 버전 관리: 날짜_버전 형식으로 저장", desc: "2024-03-15_v01, v02... 최종본은 _FINAL 표기" },
  { title: "완성 프로젝트 압축 보관: 영상 파일 + .prproj 함께 저장", desc: "2년 이상 보관 권장 — 재편집 의뢰 대비" },
], s++, "code1");

// 66: 나만의 편집 시스템
contentSlide("4강 · 시스템", "나만의 편집 스타일 시스템 만들기", [
  { main: "색보정 프리셋: 채널별 (인터뷰용, 브이로그용, 강의용) 분리 저장", sub: "자주 쓰는 Lumetri 설정을 프리셋으로 저장" },
  { main: "자막 mogrt 팩: 하단·강조·챕터 타이틀 세트로 구성", sub: "브랜드 컬러·폰트 고정해 채널 일관성 유지" },
  { main: "Export 프리셋: 유튜브·인스타·쇼츠 각각 저장", sub: "출력 시 매번 설정 없이 프리셋 선택만으로 완료" },
  { main: "편집 체크리스트: 항목별 최종 확인 습관화", sub: "자막 오탈자 → 오디오 믹싱 → 영상 품질 → 썸네일" },
], s++, "workflow");

// 67: 단축키 정리
shortcutSlide("4강 · 단축키", "자동화 관련 핵심 단축키", [
  { action: "텍스트(자막) 패널 열기", key: "Ctrl+Shift+T" },
  { action: "필수 그래픽 패널",       key: "Shift+W" },
  { action: "Auto Reframe 실행",      key: "Ctrl+Alt+A" },
  { action: "오디오 트랙 믹서",       key: "Shift+9" },
  { action: "마커 추가",              key: "M" },
  { action: "시퀀스 설정 열기",       key: "Ctrl+Shift+N" },
  { action: "프로젝트 저장",          key: "Ctrl+S" },
  { action: "내보내기 설정",          key: "Ctrl+M" },
], s++, "code1");

// 68: AI Before/After
beforeAfterSlide("4강 · 비교", "AI 도구 도입 전후 편집 시간 비교",
  ["자막 타이핑: 10분 영상 기준 60~90분", "쇼츠 세로 편집: 클립별 수동 크롭 1~2시간", "노이즈 제거: Audition 수동 작업 30분", "총 후처리 시간: 4~6시간"],
  ["Speech to Text 교정: 10~20분", "Auto Reframe 자동 변환: 3~5분", "Enhanced Speech 원클릭: 1분", "총 후처리 시간: 1~2시간"],
  "AI는 완성본이 아닌 '초안 생성 도구' — 반드시 교정·검수 과정 필수",
s++, "ai3");

// 69: 4강 요약
summarySlide("4강 · 정리", "4강 핵심 요약", [
  { title: "프리셋 & mogrt",   desc: "반복 작업 프리셋화, mogrt로 자막 품질과 속도 동시 향상" },
  { title: "프리미어 AI 기능", desc: "Auto Reframe·Speech to Text·Enhanced Speech로 시간 단축" },
  { title: "외부 AI 도구",     desc: "Runway(영상 AI)·Topaz(업스케일)로 품질 한계 돌파" },
  { title: "편집 루틴 시스템", desc: "4단계 루틴 + 프리셋 + 아카이빙으로 지속 가능한 편집 습관" },
], s++, "ai2");

// ─── 슬라이드 70: 12주차 마무리 ────────────────────────────
{
  const slide = pres.addSlide();
  bg(slide);

  // 배경 이미지
  try {
    slide.addImage({
      path: IMG("cover_main"),
      x: 0, y: 0, w: W, h: H,
      sizing: { type: "cover", w: W, h: H },
      transparency: 75
    });
  } catch(e) {}

  // 우측 색상 블록
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 0, w: 2.5, h: H, fill: { color: C.accent }
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.06, fill: { color: C.accent }
  });

  label(slide, "12주차 완료", 0.6, 0.58);
  slide.addText("수고하셨습니다!", {
    x: 0.6, y: 1.0, w: 7, h: 0.95,
    fontFace: FONT, fontSize: 40, bold: true, color: C.white, margin: 0
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 2.1, w: 1.8, h: 0.045, fill: { color: C.accent }
  });

  const completedItems = [
    "1강: 키프레임 & 속도 조절 — 줌인/아웃, 팝업, Speed Ramp",
    "2강: 사운드 디자인 — 노이즈 제거, BGM Ducking, SFX",
    "3강: 색보정 & PIP — Lumetri 3분 공식, LUT, 화면 속 화면",
    "4강: 자동화·AI·워크플로우 — 프리셋, mogrt, AI 도구, 루틴",
  ];
  completedItems.forEach((item, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 2.3 + i * 0.65, w: 0.4, h: 0.4, fill: { color: C.accent }
    });
    slide.addText("✓", {
      x: 0.6, y: 2.3 + i * 0.65, w: 0.4, h: 0.4,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0
    });
    slide.addText(item, {
      x: 1.15, y: 2.32 + i * 0.65, w: 6, h: 0.4,
      fontFace: FONT, fontSize: 12.5, color: C.white, margin: 0, valign: "middle"
    });
  });

  slide.addText("팀비블 · 프리미어 프로 실전 과정", {
    x: 0.6, y: 5.25, w: 6, h: 0.2,
    fontFace: FONT, fontSize: 8.5, color: C.muted, margin: 0
  });

  slideNum(slide, 70);
}

// ─── 출력 ───────────────────────────────────────────────────
const outputPath = "/Users/taemin/Downloads/youtube-analysis/public/week12-lecture.pptx";
pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`✅ 완성: ${outputPath}`);
    console.log(`📊 총 슬라이드 수: ${pres.slides.length}`);
  })
  .catch(err => {
    console.error("❌ 오류:", err);
    process.exit(1);
  });
