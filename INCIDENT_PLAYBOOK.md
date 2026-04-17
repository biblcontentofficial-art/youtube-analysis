# 🚨 bibl lab 장애 대응 플레이북

> 마지막 업데이트: 2026-04-17
> DB 스냅샷 기준: profiles 174건, subscriptions 1건, payments 1건

---

## 시나리오 1: DB 데이터가 전부 날아간 경우

### 즉시 대응 (골든타임 5분)

**Step 1. 서비스 점검 페이지 띄우기**
```bash
# Vercel 환경변수에 MAINTENANCE_MODE=true 추가 후 재배포
# 또는 즉시 _middleware.ts로 점검 페이지 리다이렉트
```

**Step 2. Supabase 백업 복구**
1. https://supabase.com/dashboard/project/bvozolyzzauvfcaycsrv/settings/database
2. **Backups** 탭 클릭
3. Free 플랜: 최근 일일 백업에서 복구
4. Pro 플랜($25/월): Point-in-Time Recovery로 분 단위 복구 가능

**Step 3. 백업이 없는 경우 (최악)**
- Supabase Support에 긴급 티켓: https://supabase.help
- "Accidental data deletion, need recovery" 제목으로 제출
- Project ref: `bvozolyzzauvfcaycsrv`

### 예방 조치 (지금 설정)
1. **Supabase Pro 플랜 업그레이드** → PITR 활성화
2. **주간 수동 백업 스크립트** 실행 (아래 참조)
3. **DELETE/TRUNCATE 방지 정책** 적용

---

## 시나리오 2: 업데이트 중 테이블 컬럼이 통째로 없어진 경우

### 즉시 대응

**Step 1. 어떤 컬럼이 없어졌는지 확인**
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '문제테이블명'
ORDER BY ordinal_position;
```

**Step 2. 컬럼 복구 SQL (주요 테이블별)**

profiles 테이블 전체 스키마:
```sql
-- 누락된 컬럼만 추가 (이미 있으면 에러나므로 안전)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

subscriptions 테이블:
```sql
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

payments 테이블:
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KRW';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_key TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
```

**Step 3. 데이터는 남아있는지 확인**
```sql
SELECT count(*) FROM 문제테이블명;
```
- 데이터가 있으면: 컬럼만 복구하면 OK
- 데이터도 없으면: 시나리오 1 대응으로 전환

### 예방 조치
1. **migration 파일로 스키마 관리** (Supabase CLI `supabase db diff`)
2. **ALTER TABLE DROP COLUMN 실행 전 반드시 백업**
3. SQL Editor에서 직접 DDL 실행 자제 → migration으로 관리

---

## 시나리오 3: 서버 접속 불가 (재배포해도 동일)

### 즉시 진단 순서 (5분 컷)

**Step 1. 어디가 문제인지 파악**
```
[사용자] → [Vercel] → [Supabase DB]
                    → [Upstash Redis]
                    → [외부 API: YouTube, Clerk, PortOne]
```

**Step 2. 각 서비스 상태 확인**
- Vercel 상태: https://www.vercel-status.com
- Supabase 상태: https://status.supabase.com
- Upstash 상태: https://status.upstash.com
- Clerk 상태: https://status.clerk.com

**Step 3. Vercel 로그 확인**
1. https://vercel.com/dashboard → bibl-lab 프로젝트
2. **Logs** 탭 → Runtime Logs
3. 에러 패턴 확인:
   - `ECONNREFUSED` → DB 연결 문제
   - `401/403` → API 키 만료
   - `500` → 코드 버그
   - `504 Gateway Timeout` → DB 느림 또는 다운

**Step 4. 원인별 대응**

| 원인 | 증상 | 해결 |
|------|------|------|
| Supabase 다운 | DB 관련 모든 API 500 | Supabase 상태 페이지 확인, 기다리기 |
| API 키 만료 | 401 에러 반복 | Vercel 환경변수에서 키 갱신 후 재배포 |
| Clerk 장애 | 로그인/회원가입 불가 | Clerk 상태 확인, 기다리기 |
| Redis 다운 | 검색 제한 관련 에러 | Upstash 확인, Redis 없이 동작하도록 fallback |
| DNS 문제 | 도메인 자체 접속 불가 | Vercel DNS 설정 확인 |
| 빌드 에러 | 배포 자체 실패 | Vercel Build Logs 확인, 마지막 성공 배포로 롤백 |

**Step 5. Vercel 즉시 롤백**
1. Vercel Dashboard → Deployments
2. 마지막으로 정상 작동한 배포 찾기
3. 우측 ... 메뉴 → **Promote to Production**
4. 즉시 이전 버전으로 복구됨

---

## 🔧 예방 인프라 (지금 설정 권장)

### 1. 수동 DB 백업 스크립트
```bash
# 주 1회 실행 권장
npx supabase db dump --db-url "postgresql://postgres:[비밀번호]@db.bvozolyzzauvfcaycsrv.supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
```

### 2. 점검 페이지 (maintenance mode)
`src/middleware.ts`에 추가:
```typescript
if (process.env.MAINTENANCE_MODE === 'true') {
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}
```

### 3. 모니터링 알림 설정
- **Vercel**: Integration → Slack/Discord Webhook 연동
- **Supabase**: Dashboard → Reports → 알림 설정
- **UptimeRobot** (무료): https://bibllab.com 5분 간격 모니터링 → 다운 시 이메일 알림

### 4. 환경변수 & 키 만료 관리
| 키 | 만료일 | 갱신 위치 |
|----|--------|-----------|
| GitHub PAT | 무기한 (2026-04 갱신) | github.com/settings/tokens |
| Supabase Service Key | 2089-01-15 | .env.local |
| Clerk Keys | 무기한 | clerk.com/dashboard |
| YouTube API Key | 무기한 | console.cloud.google.com |
| Upstash Redis | 무기한 | upstash.com/console |

---

## 📞 긴급 연락처

- **Supabase Support**: https://supabase.help (Pro 플랜 시 우선 응답)
- **Vercel Support**: https://vercel.com/help
- **Clerk Support**: https://clerk.com/support
- **PortOne(결제)**: 1670-5765

---

## 고객 커뮤니케이션 템플릿

### 점검 공지 (즉시)
```
[bibl lab 긴급 점검 안내]

안녕하세요, bibl lab입니다.
현재 시스템 점검으로 일시적으로 서비스 이용이 제한되고 있습니다.

- 예상 복구 시간: OO시 OO분
- 영향 범위: 검색/결제/로그인

빠르게 복구하겠습니다. 불편을 드려 죄송합니다.
```

### 복구 완료 공지
```
[bibl lab 서비스 정상화 안내]

안녕하세요, bibl lab입니다.
OO시 OO분부로 서비스가 정상화되었습니다.

이용에 불편을 드려 죄송합니다.
장애 기간 중 결제 관련 문제가 있으신 분은 문의 부탁드립니다.
```
