#!/bin/bash
# GitHub 레포 생성 및 코드 업로드 스크립트
# 사용법: GITHUB_TOKEN=ghp_xxx GITHUB_USER=your_username bash setup-github.sh

set -e

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_USER" ]; then
  echo "사용법: GITHUB_TOKEN=ghp_xxx GITHUB_USER=깃허브유저명 bash setup-github.sh"
  echo ""
  echo "GitHub Personal Access Token 발급 방법:"
  echo "1. github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)"
  echo "2. Generate new token → repo 권한 체크 → Generate"
  exit 1
fi

REPO_NAME="youtube-analysis"

echo "📦 GitHub 레포 생성 중..."
curl -s -X POST "https://api.github.com/user/repos" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"bibl lab - 유튜브 트렌드 분석 도구\"}" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('레포 생성:', d.get('html_url','이미 존재함 - 계속 진행'))"

echo ""
echo "🔗 Git remote 설정 중..."
cd /Users/taemin/Downloads/youtube-analysis
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"

echo "📤 코드 업로드 중..."
git push -u origin main

echo ""
echo "✅ 완료!"
echo "GitHub 주소: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "다음 단계: Vercel에 GitHub 연동 (선택)"
echo "Vercel 대시보드 → youtube-analysis 프로젝트 → Settings → Git → Connect"
