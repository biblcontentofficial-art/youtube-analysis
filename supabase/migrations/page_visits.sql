-- 페이지 방문 추적 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS page_visits (
  id        bigserial PRIMARY KEY,
  page      text NOT NULL,          -- 'tmkstudio' | 'teambibl'
  referrer  text,                   -- HTTP Referer 헤더 전체값
  source    text NOT NULL DEFAULT 'direct', -- 파싱된 소스명
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_visits_page_idx       ON page_visits(page);
CREATE INDEX IF NOT EXISTS page_visits_visited_at_idx ON page_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS page_visits_source_idx     ON page_visits(source);
