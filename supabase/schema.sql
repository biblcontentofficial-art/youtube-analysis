-- ============================================================
-- bibl lab DB 스키마
-- Supabase SQL Editor에서 한 번 실행하면 됩니다.
-- ============================================================

-- 1. 구독 현황 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,   -- Clerk userId
  plan            TEXT NOT NULL,          -- 'starter' | 'pro' | 'business'
  billing_key     TEXT,                   -- 토스 빌링키 (정기결제용)
  customer_key    TEXT,                   -- 토스 customerKey (= Clerk userId)
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'cancelled' | 'expired'
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_billing_at TIMESTAMPTZ,            -- 다음 결제 예정일
  cancelled_at    TIMESTAMPTZ,            -- 취소일
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 결제 이력 테이블
CREATE TABLE IF NOT EXISTS payments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,              -- Clerk userId
  plan        TEXT NOT NULL,              -- 결제한 플랜
  amount      INTEGER NOT NULL,           -- 결제 금액 (원)
  order_id    TEXT NOT NULL UNIQUE,       -- 주문번호
  payment_key TEXT,                       -- 토스 paymentKey
  status      TEXT NOT NULL DEFAULT 'success',  -- 'success' | 'failed' | 'cancelled'
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw         JSONB                       -- 토스 응답 전체 (참조용)
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Row Level Security
-- 서버는 SUPABASE_SERVICE_ROLE_KEY를 사용하므로 RLS를 우회 → 서비스 코드에 영향 없음
-- anon key 직접 접근을 차단하기 위해 모든 테이블에 RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 6. 검색 기록 테이블 (Starter 이상)
CREATE TABLE IF NOT EXISTS search_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,              -- Clerk userId
  term        TEXT NOT NULL,              -- 검색어
  count       INTEGER NOT NULL DEFAULT 1, -- 검색 횟수
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, term)
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- 7. 수집한 영상 테이블 (Pro 이상)
CREATE TABLE IF NOT EXISTS saved_videos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          TEXT NOT NULL,              -- Clerk userId
  video_id         TEXT NOT NULL,              -- YouTube videoId
  title            TEXT NOT NULL,
  thumbnail        TEXT,
  channel_id       TEXT,
  channel_title    TEXT,
  channel_thumbnail TEXT,
  subscriber_count TEXT,
  view_count       INTEGER DEFAULT 0,
  published_at     TEXT,
  score            TEXT,                       -- Good | Normal | Bad
  performance_ratio TEXT,
  query            TEXT,                       -- 수집 시 검색 키워드
  saved_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_videos_user_id ON saved_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_videos_saved_at ON saved_videos(saved_at DESC);

ALTER TABLE saved_videos ENABLE ROW LEVEL SECURITY;

-- 8. 상담 신청 테이블 (TMK STUDIO 채널 대행 폼)
CREATE TABLE IF NOT EXISTS consulting_submissions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  channel_url TEXT,
  source      TEXT,
  service     TEXT NOT NULL,
  goal        TEXT NOT NULL,
  budget      TEXT NOT NULL,
  message     TEXT
);

CREATE INDEX IF NOT EXISTS idx_consulting_submissions_created_at ON consulting_submissions(created_at DESC);

ALTER TABLE consulting_submissions ENABLE ROW LEVEL SECURITY;

-- 9. 스레드 Meta 계정 연결 (threads_connections)
CREATE TABLE IF NOT EXISTS threads_connections (
  user_id          TEXT NOT NULL PRIMARY KEY,   -- Clerk userId
  access_token     TEXT NOT NULL,               -- Long-lived access token (60일)
  threads_user_id  TEXT NOT NULL,               -- Threads user ID
  username         TEXT NOT NULL,               -- Threads username
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_connections_user_id ON threads_connections(user_id);

ALTER TABLE threads_connections ENABLE ROW LEVEL SECURITY;

-- 10. 수집한 스레드 게시물 (saved_threads)
CREATE TABLE IF NOT EXISTS saved_threads (
  user_id         TEXT NOT NULL,
  post_id         TEXT NOT NULL,
  text            TEXT,
  media_type      TEXT,
  permalink       TEXT,
  username        TEXT,
  followers_count INTEGER DEFAULT 0,
  like_count      INTEGER DEFAULT 0,
  repost_count    INTEGER DEFAULT 0,
  replies_count   INTEGER DEFAULT 0,
  viral_score     NUMERIC DEFAULT 0,
  published_at    TEXT,
  query           TEXT,
  memo            TEXT,
  is_favorite     BOOLEAN DEFAULT FALSE,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_threads_user_id ON saved_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_threads_saved_at ON saved_threads(saved_at DESC);

ALTER TABLE saved_threads ENABLE ROW LEVEL SECURITY;
