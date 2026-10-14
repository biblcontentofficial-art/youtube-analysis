#!/usr/bin/env node
/**
 * 디자인 규칙 검사 (소유자 확정 테마 + 리뉴얼 공통 완료 기준).
 *
 * 문자열 리터럴·템플릿·JSX 텍스트만 본다(주석은 AST 에 없으므로 자동 제외).
 * 기본 범위는 ux-baseline 태그 이후 바뀐 파일 + 새 파일이며, src/app/api/** 는 제외한다.
 *
 *   node scripts/ux/check-theme.mjs                     바뀐 파일만
 *   node scripts/ux/check-theme.mjs --files a.tsx b.tsx 지정 파일
 *   node scripts/ux/check-theme.mjs --all               src 전체 (현황 파악용)
 *   --base <ref>  비교 기준 (기본 ux-baseline)
 *
 * ERROR 가 있으면 exit 1. WARN 은 보고만 한다(항목 완료 기준에 따라 판단).
 *
 * 잠금(C18b, DESIGN 9.3 단계 4): globals.css 에서 Tailwind 기본 팔레트를 비웠으므로 기본 팔레트·white/black
 * 클래스(default-palette)·블러·에메랄드는 ERROR 다. 토큰 밖 색 클래스는 빌드 오류 없이 CSS 에서 빠지기 때문에
 * 이 검사가 유일한 경보다. 허용 목록(ALLOW) 파일만 구 테마 색을 쓸 수 있고, 거기서 새 색 단계를 쓰면
 * globals.css 의 '허용 목록 재선언' 블록에도 더해야 한다.
 *   npm run check:theme   = --all (사용자 화면 전체 + 허용 목록 예외). ERROR 0 이어야 한다.
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const base = opt("--base") ?? "ux-baseline";

const RULES = [
  // ERROR: 소유자 금지 패턴
  { level: "ERROR", id: "cool-gray/teal", allow: true, re: /\b(?:gray|slate|zinc|teal)-(?:50|[1-9]00|950)\b/g, msg: "쿨그레이·틸 (neutral 로)" },
  { level: "ERROR", id: "gradient", allow: true, re: /\b(?:bg-gradient-to-[a-z]+|bg-linear-to-[a-z]+|bg-(?:linear|radial|conic)-|(?:from|via|to)-(?:[a-z]+-\d{2,3}|transparent|black|white|current|\[))/g, msg: "그라데이션" },
  { level: "ERROR", id: "glow", re: /shadow-\[0_0/g, msg: "글로우 섀도" },
  { level: "ERROR", id: "ping", re: /\banimate-ping\b/g, msg: "펄스 도트(animate-ping)" },
  { level: "ERROR", id: "outline-hidden+focus", re: /\boutline-(?:hidden|none)\b[^"'`]*\bfocus-visible:outline-(?:1|2)\b|\bfocus-visible:outline-(?:1|2)\b[^"'`]*\boutline-(?:hidden|none)\b/g, msg: "outline-hidden/none 과 focus-visible:outline 을 같이 쓰면 링이 그려지지 않는다" },
  // WARN: 항목별 판단
  { level: "WARN", id: "pulse", re: /\banimate-pulse\b/g, msg: "animate-pulse (로딩 스켈레톤만 허용)" },
  { level: "WARN", id: "low-contrast-text", re: /\btext-neutral-(?:600|700|800)\b/g, msg: "검정 위 정보 글자 대비 부족 (장식·aria-hidden 만 허용)" },
  { level: "WARN", id: "tiny-text", re: /\btext-\[(?:[5-9]|10|11)(?:\.\d+)?px\]/g, msg: "12px 미만 글자 (영문 라벨 예외)" },
  { level: "WARN", id: "outline-none", re: /\b(?:focus:)?outline-none\b/g, msg: "outline-none (전역 포커스 링을 지운다)" },
  // 모노크롬 실버 전환(DESIGN.md 9.3). allow: true 인 규칙은 허용 목록(ALLOW) 파일에서 건너뛴다(위 쿨그레이·틸·그라데이션 포함).
  // 에메랄드는 폐기된 색이라 ERROR(옛 accent-literal WARN 을 올린 것). emerald-* 클래스·#00E5A0·#66FFCC·rgba(0,229,160)
  { level: "ERROR", id: "emerald", allow: true, re: /\bemerald-(?:50|[1-9]00|950)\b|#(?:00E5A0|66FFCC)\b|\b0,\s*229,\s*160\b/gi, msg: "에메랄드 (폐기, DESIGN 2.4 대응표로)" },
  // 기본 팔레트(채도 색 포함)·white/black 클래스. C18b 에서 ERROR 로 잠금(globals.css 가 기본 팔레트를 비웠다)
  { level: "ERROR", id: "default-palette", allow: true, re: /\b(?:neutral|gray|slate|zinc|stone|teal|cyan|emerald|green|red|amber|yellow|orange|sky|blue|indigo|purple|violet|pink|rose|fuchsia|lime)-(?:50|[1-9]00|950)\b|\b(?:text|bg|border(?:-[trblxyse])?|ring(?:-offset)?|inset-ring|divide(?:-[xy])?|fill|stroke|outline|decoration|placeholder|accent|caret|from|via|to|shadow|inset-shadow|text-shadow)-(?:white|black)\b/g, msg: "기본 팔레트 (DESIGN.md 2.3 대응표로 토큰에)" },
  // 블러: 클래스와 인라인 filter 값 문자열('blur(6px)'). 키(filter·backdropFilter)는 문자열이 아니라 못 본다. C18b 에서 ERROR 로 잠금
  { level: "ERROR", id: "blur", allow: true, re: /\b(?:backdrop-)?blur(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|\[[^\]]+\]))?(?![\w-])|\bblur\(/g, msg: "블러 (클래스·인라인 filter 값, DESIGN 1.3)" },
];

/**
 * 허용 목록(DESIGN.md 9.3, C18a 에서 확정. C18b 재선언 대상과 같은 목록). allow 규칙만 건너뛴다.
 * 여기 파일이 쓰는 기본 팔레트 단계는 globals.css '허용 목록 재선언' 블록에 있어야 그려진다.
 * 관리자 화면·관리자 미리보기 부품은 구 테마 유지(3.3), tmklab-site 는 별도 브랜드, ux-preview 는 로컬 전용.
 * 파일이 아닌 예외 두 가지(구글 로고 SVG fill 4색 hex, 대화상자 backdrop:bg-[rgb(0_0_0/0.8)])는 위 규칙이
 * 잡지 않는 리터럴 값이라 여기에 경로로 넣지 않는다.
 */
const ALLOW = [
  /^src\/app\/admin\//,
  /^src\/app\/insights\/admin\//,
  /^src\/app\/community\/admin\//,
  /^src\/app\/insights\/_components\/PostRenderer\.tsx$/,
  /^src\/app\/tmklab-site\//,
  /^src\/app\/ux-preview\//,
];
const EMDASH = /—/g;
const HANGUL = /[가-힣]/;
const EMOJI = /\p{Extended_Pictographic}/gu;
const FLAG = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;

function changedFiles() {
  const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); } catch { return []; } };
  return [...new Set([
    ...sh(`git diff --name-only ${base} -- src`),
    ...sh(`git ls-files --others --exclude-standard -- src`),
  ])];
}

let files;
if (args.includes("--all")) files = execSync("git ls-files -- src", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
else if (args.includes("--files")) files = args.slice(args.indexOf("--files") + 1).filter((a) => !a.startsWith("--"));
else files = changedFiles();

files = files
  .map((f) => f.replace(/^\.\//, ""))
  .filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.endsWith(".d.ts"))
  .filter((f) => !f.startsWith("src/app/api/") && !f.includes("/ux-preview/"))
  .filter((f) => existsSync(path.join(ROOT, f)));

const report = [];
for (const f of files) {
  const allowed = ALLOW.some((re) => re.test(f));
  const text = readFileSync(path.join(ROOT, f), "utf8");
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];
  const line = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const check = (node, s, isJsxText) => {
    for (const r of RULES) {
      if (r.allow && allowed) continue;
      for (const m of s.matchAll(r.re)) hits.push({ level: r.level, id: r.id, line: line(node.getStart(sf)), sample: m[0], msg: r.msg });
    }
    const uiText = isJsxText || HANGUL.test(s);
    if (uiText && EMDASH.test(s)) hits.push({ level: "WARN", id: "em-dash", line: line(node.getStart(sf)), sample: s.trim().slice(0, 40), msg: "화면 문구의 긴 하이픈(—)" });
    EMDASH.lastIndex = 0;
    const flags = s.match(FLAG);
    const emo = s.replace(FLAG, "").match(EMOJI);
    if (emo) hits.push({ level: "WARN", id: "emoji", line: line(node.getStart(sf)), sample: emo.join(""), msg: "이모지 아이콘 (맨 SVG 로)" });
    if (flags) hits.push({ level: "WARN", id: "flag-emoji", line: line(node.getStart(sf)), sample: flags.join(""), msg: "국기 이모지 (SearchBar REGIONS 는 예외로 판단)" });
  };
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) check(n, n.text, false);
    else if (ts.isTemplateExpression(n)) { check(n, n.head.text, false); n.templateSpans.forEach((sp) => check(sp, sp.literal.text, false)); }
    else if (ts.isJsxText(n)) { if (n.text.trim()) check(n, n.text, true); }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (hits.length) report.push({ f, hits });
}

let errors = 0, warns = 0;
const byId = {};
for (const { f, hits } of report) {
  console.log(`\n${f}`);
  const seen = new Set();
  for (const h of hits.sort((a, b) => a.line - b.line)) {
    const key = `${h.level}${h.id}${h.line}${h.sample}`;
    if (seen.has(key)) continue; seen.add(key);
    if (h.level === "ERROR") errors++; else warns++;
    byId[h.id] = (byId[h.id] ?? 0) + 1;
    console.log(`  ${h.level === "ERROR" ? "ERROR" : "warn "} :${String(h.line).padEnd(5)} ${h.id.padEnd(18)} ${h.sample}  — ${h.msg}`);
  }
}
if (Object.keys(byId).length) console.log(`\n규칙별: ${Object.entries(byId).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
console.log(`\n검사 파일 ${files.length}개 · ERROR ${errors} · WARN ${warns}`);
console.log(errors ? "THEME_ERRORS" : "THEME_OK");
process.exitCode = errors ? 1 : 0; // exit() 는 파이프로 넘기는 긴 출력을 끝까지 쓰기 전에 끊는다
