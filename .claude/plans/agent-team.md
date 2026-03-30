# 에이전트 팀 제작 계획

## 개요
범용 에이전트 팀을 Claude Code 플러그인으로 제작합니다.
위치: `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/agent-team/`

## 에이전트 목록 (8개)

### 1. planner (기획자)
- **역할**: 전체 그림을 그리고, 기능을 설계하고, 작업을 단계별로 분해
- **활용 시점**: "이 기능 기획해줘", "구조 설계해줘", "작업 계획 세워줘"
- **핵심 능력**: 요구사항 분석 → 기술 설계 → 작업 분해 → 우선순위 결정
- **model**: opus / **color**: blue

### 2. researcher (리서처)
- **역할**: 자료 조사, API 문서 분석, 경쟁사 조사, 기술 비교 분석
- **활용 시점**: "이 기술 조사해줘", "비교 분석해줘", "레퍼런스 찾아줘"
- **핵심 능력**: 웹 검색 → 문서 수집 → 핵심 정리 → 실행 가능한 인사이트 도출
- **model**: sonnet / **color**: cyan

### 3. coder (풀스택 코더)
- **역할**: 복잡한 기능 구현, 리팩토링, 성능 최적화
- **활용 시점**: "이 기능 구현해줘", "리팩토링해줘", "최적화해줘"
- **핵심 능력**: 기존 코드 분석 → 패턴 파악 → 구현 → 검증
- **model**: opus / **color**: green

### 4. code-reviewer (코드 리뷰어)
- **역할**: 코드 품질, 보안 취약점, 성능 이슈, 베스트 프랙티스 검토
- **활용 시점**: "코드 리뷰해줘", "이거 괜찮은지 봐줘", "보안 점검해줘"
- **핵심 능력**: 변경사항 파악 → 이슈 탐지 → 심각도 분류 → 개선안 제시
- **model**: sonnet / **color**: red

### 5. qa-tester (QA 테스터)
- **역할**: 테스트 코드 작성, 엣지 케이스 발견, 테스트 실행 및 결과 분석
- **활용 시점**: "테스트 작성해줘", "테스트 돌려줘", "버그 찾아줘"
- **핵심 능력**: 테스트 전략 수립 → 테스트 작성 → 실행 → 커버리지 분석
- **model**: sonnet / **color**: yellow

### 6. ux-writer (UX 카피라이터)
- **역할**: UI 텍스트 작성, 에러 메시지 개선, 사용자 경험 문구 최적화
- **활용 시점**: "카피 써줘", "문구 다듬어줘", "에러 메시지 개선해줘"
- **핵심 능력**: 사용자 맥락 파악 → 톤앤매너 설정 → 문구 작성 → A/B 제안
- **model**: sonnet / **color**: magenta

### 7. seo-marketer (SEO 마케터)
- **역할**: SEO 최적화, 메타태그, 구조화 데이터, 성능 분석, 마케팅 전략
- **활용 시점**: "SEO 점검해줘", "메타태그 최적화해줘", "마케팅 전략 세워줘"
- **핵심 능력**: 현재 상태 감사 → 이슈 도출 → 최적화 구현 → 성과 측정 가이드
- **model**: sonnet / **color**: yellow

### 8. devops (DevOps 엔지니어)
- **역할**: 배포, CI/CD, 환경 설정, 모니터링, 인프라 관리
- **활용 시점**: "배포해줘", "CI/CD 세팅해줘", "환경 설정해줘"
- **핵심 능력**: 인프라 분석 → 파이프라인 설계 → 구성 → 검증
- **model**: sonnet / **color**: cyan

## 파일 구조
```
~/.claude/plugins/marketplaces/claude-plugins-official/plugins/agent-team/
├── .claude-plugin/
│   └── plugin.json
└── agents/
    ├── planner.md
    ├── researcher.md
    ├── coder.md
    ├── code-reviewer.md
    ├── qa-tester.md
    ├── ux-writer.md
    ├── seo-marketer.md
    └── devops.md
```

## 구현 순서
1. plugin.json 생성
2. 8개 에이전트 파일 병렬 생성
