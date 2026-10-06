#!/usr/bin/env node
/**
 * 불변 조건 1(검색 결과 수 누적 로직) 보호 검사.
 *
 * 보호 대상 함수·구문의 토큰 열(주석·공백 무시)을 해시해 기준값과 비교한다.
 * 줄 번호가 아니라 AST 로 찾으므로, 앞뒤 마크업이 바뀌거나 함수가 다른 파일로 옮겨져도
 * 본문이 글자 그대로면 통과한다.
 *
 *   node scripts/ux/check-invariants.mjs                 비교 (바뀐 곳이 있으면 exit 1)
 *   node scripts/ux/check-invariants.mjs --write-baseline 기준값 갱신 (소유자 승인 후에만)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const BASELINE = path.join(ROOT, "scripts/ux/invariants.baseline.json");

/**
 * file: 우선 찾을 파일. 없거나 그 안에 없으면 search 범위 전체에서 이름으로 찾는다(파일 이동 허용).
 * kind:
 *   decl  : 이름이 name 인 함수 선언 또는 변수 선언(화살표 함수·useCallback 포함)
 *   if    : 함수 fn 안에서 조건 텍스트가 cond 인 if 문
 *   tmpl  : 텍스트에 includes 를 포함하는 템플릿 문자열 (fn 안으로 한정 가능)
 *   attr  : JSX 속성 name 의 값 텍스트가 value 인 것의 개수
 */
const TARGETS = [
  // SearchBar: 기록 형식과 저장·검색 실행·기록 재방문
  { id: "SearchBar.localHistoryKey", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "localHistoryKey" },
  { id: "SearchBar.loadLocalHistory", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "loadLocalHistory" },
  { id: "SearchBar.loadAllLocalHistory", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "loadAllLocalHistory" },
  { id: "SearchBar.saveLocalHistory", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "saveLocalHistory" },
  { id: "SearchBar.saveToHistory", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "saveToHistory" },
  { id: "SearchBar.executeSearch", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "executeSearch" },
  { id: "SearchBar.navigateFromHistory", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "navigateFromHistory" },
  { id: "SearchBar.handleSubmit", file: "src/app/_components/SearchBar.tsx", kind: "decl", name: "handleSubmit" },
  // 검색 페이지(서버): 캐시 확인 → 차감 → 조회
  { id: "search/page.if(query)", file: "src/app/search/page.tsx", kind: "if", fn: "SearchPage", cond: "query" },
  { id: "search/page.filterBase", file: "src/app/search/page.tsx", kind: "decl", name: "filterBase" },
  // 결과 목록: 더보기 누적
  { id: "SearchResultList.handleLoadMore", file: "src/app/search/_components/SearchResultList.tsx", kind: "decl", name: "handleLoadMore" },
  { id: "SearchResultList.dedup", file: "src/app/search/_components/SearchResultList.tsx", kind: "decl", name: "dedup" },
  { id: "SearchResultList.key(video.videoId)", file: "src/app/search/_components/SearchResultList.tsx", kind: "attr", name: "key", value: "video.videoId" },
  // 홈: 저장 → /search?q=…&count=N (홈 로직이 다른 파일로 옮겨져도 이름으로 찾는다)
  { id: "home.saveToHistory", file: "src/app/page.tsx", kind: "decl", name: "saveToHistory", search: "src/app", exclude: ["src/app/_components/SearchBar.tsx"] },
  { id: "home.trySearch", file: "src/app/page.tsx", kind: "decl", name: "trySearch", search: "src/app" },
  // 마이페이지 최근 검색어 → 기록 재방문
  { id: "RecentSearches.fromHistory", file: "src/app/mypage/_components/RecentSearches.tsx", kind: "tmpl", includes: "fromHistory=1" },
];

function tokens(text) {
  const sc = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ true, ts.LanguageVariant.JSX, text);
  const out = [];
  for (let k = sc.scan(); k !== ts.SyntaxKind.EndOfFileToken; k = sc.scan()) out.push(sc.getTokenText());
  return out.join(" ");
}
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16);

function parse(file) {
  const abs = path.join(ROOT, file);
  if (!existsSync(abs)) return null;
  return ts.createSourceFile(abs, readFileSync(abs, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function walk(node, fn) {
  fn(node);
  ts.forEachChild(node, (c) => walk(c, fn));
}

function findDecls(sf, name) {
  const hits = [];
  walk(sf, (n) => {
    if ((ts.isFunctionDeclaration(n) && n.name?.text === name) ||
        (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name)) hits.push(n);
  });
  return hits;
}

function findFnBody(sf, fnName) {
  let body = null;
  walk(sf, (n) => {
    if (!body && ts.isFunctionDeclaration(n) && n.name?.text === fnName) body = n.body;
  });
  return body;
}

function extract(sf, t) {
  if (t.kind === "decl") return findDecls(sf, t.name).map((n) => n.getText(sf));
  if (t.kind === "if") {
    const root = findFnBody(sf, t.fn) ?? sf;
    const hits = [];
    walk(root, (n) => { if (ts.isIfStatement(n) && n.expression.getText(sf) === t.cond) hits.push(n.getText(sf)); });
    return hits;
  }
  if (t.kind === "tmpl") {
    const hits = [];
    walk(sf, (n) => {
      if ((ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n)) && n.getText(sf).includes(t.includes)) hits.push(n.getText(sf));
    });
    return hits;
  }
  if (t.kind === "attr") {
    let count = 0;
    walk(sf, (n) => {
      if (ts.isJsxAttribute(n) && n.name.getText(sf) === t.name && n.initializer && ts.isJsxExpression(n.initializer) &&
          n.initializer.expression?.getText(sf) === t.value) count++;
    });
    return count ? [`${t.name}={${t.value}} x${count}`] : [];
  }
  return [];
}

function listFiles(dir) {
  try {
    return execSync(`git ls-files --cached --others --exclude-standard -- "${dir}"`, { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.includes("/ux-preview/"));
  } catch { return []; }
}

function locate(t) {
  const sf = parse(t.file);
  const own = sf ? extract(sf, t) : [];
  if (own.length || !t.search) return { file: t.file, texts: own };
  // 이동 허용: search 범위에서 같은 이름을 찾는다
  for (const f of listFiles(t.search)) {
    if (f === t.file || (t.exclude ?? []).includes(f)) continue;
    const s = parse(f);
    const hits = s ? extract(s, t) : [];
    if (hits.length) return { file: f, texts: hits };
  }
  return { file: t.file, texts: [] };
}

const write = process.argv.includes("--write-baseline");
const base = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const next = {};
let bad = 0;

for (const t of TARGETS) {
  const { file, texts } = locate(t);
  const h = texts.length ? hash(texts.map(tokens).join("\n----\n")) : "MISSING";
  next[t.id] = { hash: h, file, count: texts.length };
  if (write) { console.log(`baseline ${t.id.padEnd(40)} ${h}  (${file})`); continue; }
  const b = base[t.id];
  if (!b) { console.log(`?  ${t.id.padEnd(40)} 기준값 없음`); bad++; continue; }
  if (h === b.hash) {
    console.log(`ok ${t.id.padEnd(40)} ${file !== b.file ? `(이동: ${b.file} → ${file})` : ""}`);
  } else {
    console.log(`XX ${t.id.padEnd(40)} 바뀜 ${b.hash} → ${h}  (${file})`);
    bad++;
  }
}

if (write) {
  writeFileSync(BASELINE, JSON.stringify(next, null, 2) + "\n");
  console.log(`\n기준값 저장: ${path.relative(ROOT, BASELINE)}`);
} else {
  console.log(bad ? `\nINVARIANTS_CHANGED (${bad}) — 검색 누적 로직이 바뀌었다. 되돌리거나 소유자 승인을 받는다.` : "\nINVARIANTS_OK");
  process.exit(bad ? 1 : 0);
}
