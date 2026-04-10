"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const CURRICULUM = [
  {
    week: "1주차", lessons: [
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법1 (Welcome 영상)", duration: "25:11" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법2", duration: "14:55" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법3", duration: "10:43" },
      { title: "[1주차] 진짜 유튜브로 돈 버는 방법4", duration: "16:33" },
    ],
  },
  {
    week: "2주차", lessons: [
      { title: "[2주차] 채널 프로필 세팅", duration: "15:53" },
      { title: "[2주차] 채널 기본 세팅", duration: "11:02" },
      { title: "[2주차] 유튜브 알고리즘의 이해", duration: "12:52" },
      { title: "[2주차] 좋은 영상에 대한 감 익히기", duration: "12:21" },
    ],
  },
  {
    week: "3주차", lessons: [
      { title: "[3주차] 썸네일의 중요성 이해하기", duration: "08:11" },
      { title: "[3주차] 좋은 썸네일이란?", duration: "22:45" },
      { title: "[3주차] 제목의 중요성 이해하기", duration: "07:13" },
      { title: "[3주차] 좋은 제목이란?", duration: "10:35" },
    ],
  },
  {
    week: "4주차", lessons: [
      { title: "[4주차] 썸네일 제작 기본 이론", duration: "12:15" },
      { title: "[4주차] 썸네일 제작 실습", duration: "09:57" },
      { title: "[4주차] AI 활용1 : 이미지 수정", duration: "09:20" },
      { title: "[4주차] AI 활용2 : 딥 리서치, 심층 리서치", duration: "12:30" },
    ],
  },
  {
    week: "5주차", lessons: [
      { title: "[5주차] 썸네일 이론 심화", duration: "13:22" },
      { title: "[5주차] 썸네일 기획 심화", duration: "08:09" },
      { title: "[5주차] 썸네일, 제목 테스트 기능", duration: "18:26" },
      { title: "[5주차] 썸네일 벤치마킹 심화", duration: "15:58" },
    ],
  },
  {
    week: "6주차", lessons: [
      { title: "[6주차] 원고의 중요성 & 목표 지표", duration: "21:57" },
      { title: "[6주차] 인트로 30초 기획 1", duration: "15:21" },
      { title: "[6주차] 인트로 30초 기획 2", duration: "10:57" },
      { title: "[6주차] 스토리의 7가지 요소", duration: "16:00" },
    ],
  },
  {
    week: "7주차", lessons: [
      { title: "[7주차] 본문 기획", duration: "21:41" },
      { title: "[7주차] 본문 설계", duration: "13:17" },
      { title: "[7주차] 아웃트로 설계", duration: "06:56" },
      { title: "[7주차] 실제 적용", duration: "11:18" },
    ],
  },
  {
    week: "8주차", lessons: [
      { title: "[8주차] 유튜브로 판매를 만드는 공식", duration: "19:37" },
      { title: "[8주차] 판매용 대본 기획", duration: "12:59" },
      { title: "[8주차] 랜딩페이지 제작", duration: "17:20" },
      { title: "[8주차] 판매 방식", duration: "16:02" },
    ],
  },
  {
    week: "9주차", lessons: [
      { title: "[9주차] AI 활용 방법", duration: "15:29" },
      { title: "[9주차] AI 작가 제작하기", duration: "15:12" },
      { title: "[9주차] AI 작가 에이전트", duration: "13:06" },
      { title: "[9주차] Claude 다양한 활용 방법", duration: "22:25" },
    ],
  },
  {
    week: "10주차", lessons: [
      { title: "[10주차] 스마트폰 하나로 끝내는 홈 스튜디오 세팅", duration: "--:--" },
      { title: "[10주차] 대본을 내 이야기처럼 자연스럽게 말하는 법", duration: "--:--" },
      { title: "[10주차] 시각적 몰입을 위한 B롤 기획 및 소싱", duration: "--:--" },
      { title: "[10주차] 편집 시간을 50% 줄이는 폴더 정리와 컷 편집 콘티", duration: "--:--" },
    ],
  },
  {
    week: "11주차", lessons: [
      { title: "[11주차] 프리미어 프로 기본 세팅 및 단축키", duration: "--:--" },
      { title: "[11주차] 컷 편집의 달인 되기", duration: "--:--" },
      { title: "[11주차] 자막 자동 생성과 텍스트 기반 편집", duration: "--:--" },
      { title: "[11주차] B롤 얹기와 유튜브용 최종 출력", duration: "--:--" },
    ],
  },
  {
    week: "12주차", lessons: [
      { title: "[12주차] 시청자 이탈을 막는 화면 연출 (키프레임)", duration: "--:--" },
      { title: "[12주차] 귀를 사로잡는 사운드 디자인 (BGM & 효과음)", duration: "--:--" },
      { title: "[12주차] 초간단 색보정 (Lumetri Color)", duration: "--:--" },
      { title: "[12주차] 편집 자동화 & 템플릿(플러그인) 활용법", duration: "--:--" },
    ],
  },
  {
    week: "13주차", lessons: [
      { title: "[13주차] 유튜브 업로드 최적화 설정", duration: "--:--" },
      { title: "[13주차] 제목·태그·설명 SEO 세팅", duration: "--:--" },
      { title: "[13주차] 업로드 스케줄 전략", duration: "--:--" },
      { title: "[13주차] 커뮤니티 포스팅 활용법", duration: "--:--" },
    ],
  },
  {
    week: "14주차", lessons: [
      { title: "[14주차] 유튜브 스튜디오 지표 읽는 법", duration: "--:--" },
      { title: "[14주차] 클릭률·시청 지속률 정량 분석", duration: "--:--" },
      { title: "[14주차] 댓글·공유·저장 정성 분석", duration: "--:--" },
      { title: "[14주차] 데이터 기반 다음 영상 개선 전략", duration: "--:--" },
    ],
  },
  {
    week: "15주차", lessons: [
      { title: "[15주차] 숏폼 알고리즘의 이해", duration: "--:--" },
      { title: "[15주차] 릴스·쇼츠·틱톡 플랫폼 비교", duration: "--:--" },
      { title: "[15주차] 숏폼 훅(Hook) 설계", duration: "--:--" },
      { title: "[15주차] 숏폼 기획안 작성법", duration: "--:--" },
    ],
  },
  {
    week: "16주차", lessons: [
      { title: "[16주차] 숏폼 편집 템플릿 세팅", duration: "--:--" },
      { title: "[16주차] 캡컷·프리미어로 숏폼 편집하기", duration: "--:--" },
      { title: "[16주차] 자막·음악·효과 넣기", duration: "--:--" },
      { title: "[16주차] 숏폼 업로드 전략", duration: "--:--" },
    ],
  },
  {
    week: "17주차", lessons: [
      { title: "[17주차] 고조회수 숏폼 구조 분석", duration: "--:--" },
      { title: "[17주차] 숏폼 시리즈 전략", duration: "--:--" },
      { title: "[17주차] 롱폼과 숏폼 연계 전략", duration: "--:--" },
      { title: "[17주차] 숏폼 성과 분석 및 개선", duration: "--:--" },
    ],
  },
  {
    week: "18주차", lessons: [
      { title: "[18주차] 숏폼으로 DB 수집하기", duration: "--:--" },
      { title: "[18주차] 숏폼과 링크 연결 전략", duration: "--:--" },
      { title: "[18주차] 인스타그램 릴스 수익화 사례", duration: "--:--" },
      { title: "[18주차] 숏폼 광고 활용법", duration: "--:--" },
    ],
  },
  {
    week: "19주차", lessons: [
      { title: "[19주차] 멀티채널 운영 전략", duration: "--:--" },
      { title: "[19주차] 주제별 서브채널 기획", duration: "--:--" },
      { title: "[19주차] 채널 간 시너지 만들기", duration: "--:--" },
      { title: "[19주차] 리소스 최소화 다채널 운영법", duration: "--:--" },
    ],
  },
  {
    week: "20주차", lessons: [
      { title: "[20주차] 스레드(Threads) 활용 전략", duration: "--:--" },
      { title: "[20주차] X(트위터) 콘텐츠 기획", duration: "--:--" },
      { title: "[20주차] 텍스트 콘텐츠로 유튜브 유입 만들기", duration: "--:--" },
      { title: "[20주차] SNS 크로스 포스팅 전략", duration: "--:--" },
    ],
  },
  {
    week: "21주차", lessons: [
      { title: "[21주차] 네이버 리뷰노트 활용법", duration: "--:--" },
      { title: "[21주차] 블로그 체험단 신청 전략", duration: "--:--" },
      { title: "[21주차] 신문사 기사 작성법", duration: "--:--" },
      { title: "[21주차] 네이버 검색 노출 최적화", duration: "--:--" },
    ],
  },
  {
    week: "22주차", lessons: [
      { title: "[22주차] 나만의 비즈니스 모델 설계", duration: "--:--" },
      { title: "[22주차] 상품·서비스 기획 기초", duration: "--:--" },
      { title: "[22주차] 가격 설정과 포지셔닝 전략", duration: "--:--" },
      { title: "[22주차] 첫 매출 만들기 실습", duration: "--:--" },
    ],
  },
  {
    week: "23주차", lessons: [
      { title: "[23주차] 비즈니스 목적 콘텐츠 vs 브랜딩 콘텐츠", duration: "--:--" },
      { title: "[23주차] 신뢰를 쌓는 콘텐츠 유형", duration: "--:--" },
      { title: "[23주차] 판매로 이어지는 콘텐츠 구조", duration: "--:--" },
      { title: "[23주차] 비즈니스 콘텐츠 캘린더 작성", duration: "--:--" },
    ],
  },
  {
    week: "24주차", lessons: [
      { title: "[24주차] 랜딩페이지란 무엇인가", duration: "--:--" },
      { title: "[24주차] 랜딩페이지 구성 요소", duration: "--:--" },
      { title: "[24주차] 노코드 툴로 랜딩페이지 만들기", duration: "--:--" },
      { title: "[24주차] 유튜브에서 랜딩페이지로 유입시키는 법", duration: "--:--" },
    ],
  },
  {
    week: "25주차", lessons: [
      { title: "[25주차] 전환율 높이는 카피라이팅", duration: "--:--" },
      { title: "[25주차] 사회적 증거(후기·사례) 배치 전략", duration: "--:--" },
      { title: "[25주차] A/B 테스트로 랜딩페이지 최적화", duration: "--:--" },
      { title: "[25주차] 구매 버튼 설계와 결제 연동", duration: "--:--" },
    ],
  },
  {
    week: "26주차", lessons: [
      { title: "[26주차] DB란 무엇인가 (잠재고객 수집)", duration: "--:--" },
      { title: "[26주차] 이메일·카카오 채널 CRM 구축", duration: "--:--" },
      { title: "[26주차] 재구매와 구독을 만드는 CRM 전략", duration: "--:--" },
      { title: "[26주차] 광고와 유기 트래픽 조합 마케팅", duration: "--:--" },
    ],
  },
  {
    week: "27주차", lessons: [
      { title: "[27주차] 브랜딩이란 무엇인가", duration: "--:--" },
      { title: "[27주차] 퍼스널 브랜딩 vs 비즈니스 브랜딩", duration: "--:--" },
      { title: "[27주차] 내 브랜드 정체성 설계", duration: "--:--" },
      { title: "[27주차] 브랜딩 키워드와 비주얼 가이드", duration: "--:--" },
    ],
  },
  {
    week: "28주차", lessons: [
      { title: "[28주차] 브랜드 스토리 만들기", duration: "--:--" },
      { title: "[28주차] 콘텐츠로 브랜딩 강화하는 법", duration: "--:--" },
      { title: "[28주차] 채널 외형(아트워크·인트로) 브랜딩", duration: "--:--" },
      { title: "[28주차] 브랜딩 일관성 유지 전략", duration: "--:--" },
    ],
  },
  {
    week: "29주차", lessons: [
      { title: "[29주차] 나를 브랜드화하는 퍼스널 브랜딩", duration: "--:--" },
      { title: "[29주차] 시스템화로 나 없이도 돌아가는 구조 만들기", duration: "--:--" },
      { title: "[29주차] 팀과 외주를 활용한 스케일업", duration: "--:--" },
      { title: "[29주차] 퍼스널 브랜딩과 시스템의 균형 설계", duration: "--:--" },
    ],
  },
  {
    week: "30주차", lessons: [
      { title: "[30주차] 내 채널의 병목 구간 찾기", duration: "--:--" },
      { title: "[30주차] 트래픽·클릭률·시청 지속률 병목 분석", duration: "--:--" },
      { title: "[30주차] 구독자 전환 병목 진단", duration: "--:--" },
      { title: "[30주차] 병목 우선순위 설정법", duration: "--:--" },
    ],
  },
  {
    week: "31주차", lessons: [
      { title: "[31주차] 영상별 성과 비교 분석", duration: "--:--" },
      { title: "[31주차] 성공한 영상 패턴 추출", duration: "--:--" },
      { title: "[31주차] 실패한 영상 원인 분석", duration: "--:--" },
      { title: "[31주차] 진단 결과 기반 개선 계획 수립", duration: "--:--" },
    ],
  },
  {
    week: "32주차", lessons: [
      { title: "[32주차] 조회수 병목 뚫는 썸네일·제목 개선", duration: "--:--" },
      { title: "[32주차] 트래픽 소스 다각화 전략", duration: "--:--" },
      { title: "[32주차] 외부 유입(커뮤니티·SNS) 만들기", duration: "--:--" },
      { title: "[32주차] 콜라보·노출 확장 전략", duration: "--:--" },
    ],
  },
  {
    week: "33주차", lessons: [
      { title: "[33주차] 내 썸네일 클릭률 데이터 분석", duration: "--:--" },
      { title: "[33주차] 썸네일 A/B 테스트 실전", duration: "--:--" },
      { title: "[33주차] 제목 클릭률 높이는 카피라이팅", duration: "--:--" },
      { title: "[33주차] 개선 후 성과 추적", duration: "--:--" },
    ],
  },
  {
    week: "34주차", lessons: [
      { title: "[34주차] 시청 지속률 떨어지는 구간 찾기", duration: "--:--" },
      { title: "[34주차] 대본 개선으로 시청 지속률 높이기", duration: "--:--" },
      { title: "[34주차] 업로드 설정 최적화(태그·챕터·엔드카드)", duration: "--:--" },
      { title: "[34주차] 개선된 영상 성과 측정", duration: "--:--" },
    ],
  },
  {
    week: "35주차", lessons: [
      { title: "[35주차] 편집 스타일로 이탈률 낮추기", duration: "--:--" },
      { title: "[35주차] 링크 클릭률 높이는 CTA 설계", duration: "--:--" },
      { title: "[35주차] 엔드카드·카드 클릭률 최적화", duration: "--:--" },
      { title: "[35주차] 편집과 링크 개선 성과 측정", duration: "--:--" },
    ],
  },
  {
    week: "36주차", lessons: [
      { title: "[36주차] 비즈니스 모델 전환율 분석", duration: "--:--" },
      { title: "[36주차] 오퍼·가격·구성 개선 전략", duration: "--:--" },
      { title: "[36주차] 구매 여정 최적화", duration: "--:--" },
      { title: "[36주차] 비즈니스 모델 스케일업 방법", duration: "--:--" },
    ],
  },
  {
    week: "37주차", lessons: [
      { title: "[37주차] 랜딩페이지 전환율 분석", duration: "--:--" },
      { title: "[37주차] 카피·디자인·구조 개선", duration: "--:--" },
      { title: "[37주차] 신뢰 요소 추가로 전환율 높이기", duration: "--:--" },
      { title: "[37주차] 최적화 후 성과 추적", duration: "--:--" },
    ],
  },
  {
    week: "38주차", lessons: [
      { title: "[38주차] 단건 판매와 구독 모델의 차이", duration: "--:--" },
      { title: "[38주차] 내 비즈니스에 맞는 수익 모델 선택", duration: "--:--" },
      { title: "[38주차] 구독 모델 설계와 운영", duration: "--:--" },
      { title: "[38주차] 수익 다각화 전략", duration: "--:--" },
    ],
  },
  {
    week: "39주차", lessons: [
      { title: "[39주차] 장기 브랜딩 로드맵 설계", duration: "--:--" },
      { title: "[39주차] 브랜드 팬덤 만들기", duration: "--:--" },
      { title: "[39주차] 브랜드 확장 전략", duration: "--:--" },
      { title: "[39주차] 브랜딩 유지와 일관성 관리", duration: "--:--" },
    ],
  },
  {
    week: "40주차", lessons: [
      { title: "[40주차] 지속가능한 콘텐츠 운영 시스템 구축", duration: "--:--" },
      { title: "[40주차] 번아웃 없이 꾸준히 하는 법", duration: "--:--" },
      { title: "[40주차] 나만의 성장 루틴 만들기", duration: "--:--" },
      { title: "[40주차] 다음 단계로 나아가는 법", duration: "--:--" },
    ],
  },
];

const FEATURED_REVIEWS = [
  {
    title: "5만 영어 유튜버 김**님",
    rating: 5,
    text: "선생님, 안녕하세요! 중간 보고 드려요^^\n오늘 영상 월요일에 급하게 준비하느라 인트로를 너무 신경 못썼네요. 다음주부터 스케줄 여유가 생기니 철저히 준비하는 걸로..\n11월 26일부터 지금까지 약 470건 판매되었어요.\n다 선생님 덕분입니다. 너무 감사합니다!",
    highlight: "약 470건 판매되었어요.",
  },
  {
    title: "벤더사 대표님",
    rating: 5,
    text: "대표님! 안녕하세요!\n대표님을 만난 후로 유튜브는 띄엄띄엄하다가 이제 다시 편집하고 있지만, 저는 지금의 대표님이 성장하시고 다른 라인으로 확장하시는 게 진짜 너무 자랑스럽습니다!\n저는 제가 좀 더 잘돼서 대표님 자랑을 하겠습니다!\n제가 대표님을 만나고 용기를 가지고 본격적으로 벤더 다시 시작한 게 7월인데 그때부터 매출을 정리해 봤어요.",
    highlight: "",
  },
  {
    title: "초보 유튜버 김**님",
    rating: 5,
    text: "대표님! 대표님과 같이 진행하면서 확실히 흐름이 달라졌어요. 1,000명까지는 두 달 넘게 걸렸는데 2,000명은 3일 만에 달성했습니다ㅎ ㅎ\n너무 기분 좋은 아침입니다!",
    highlight: "2,000명은 3일 만에 달성",
  },
  {
    title: "브랜드 운영하는 사장님",
    rating: 5,
    text: "대표님! 이 스레드 글 하나에 문의 55건, 이틀 문의받고 하루 매출 950만원 나왔어요!ㅎ ㅎ 물론 행사 부스비라 단가가 크지만, 이익으로 따지면 30% 마진이거든요!\n자신 없어서 몇년 안하다가 대표님한테 컨설팅 받으며 용기 얻어서 하는데, 되네요. 너무 감사합니다.",
    highlight: "하루 매출 950만원",
  },
  {
    title: "비블1기 김**님",
    rating: 5,
    text: "저 기쁜 마음에 이렇게 흥분해서 문자를 드립니다. 클래스 101에서 제 영상 하나를 보시고 강의 제안이 들어왔습니다.\n\n앞으로 계획은 아직 미정이지만 일단 기쁜 소식이 이어서 알려 드립니다^^",
    highlight: "강의 제안이 들어왔습니다.",
  },
  {
    title: "팀비블 멤버 솔*님",
    rating: 5,
    text: "저는 강의도 좋았지만 실제로 비블님의 도움을 받고 성장하신 분의 사례와 어려운 점을 어떻게 이겨내셨는지 들을 수 있었던 점, 그리고 비슷한 시기에 새로운 도전을 함께 시작하는 다른 분들의 애환?을 나눌 수 있었던 것에 많은 에너지와 동기부여를 얻고 갑니다. 저는 미국에 살아서 오프모임은 자주 참여하기가 어려운데 라이브 링크라도 켜주시면 많은 도움이 될 것 같아요! 오늘 수고해주신 팀비블 운영진들 다들 너무 감사드립니다!",
    highlight: "",
  },
  {
    title: "팀비블 멤버 김** 대표님",
    rating: 5,
    text: "새벽 첫 기차에 몸을 싣고 뜻 깊은 오프라인 모임을 참석하고 왔습니다. 어제 밤만 해도 갈까 말까 고민했던 시간이 무의미할만큼 소중한 시간이었습니다.\n\n직접 비블님을 뵙고 진정성 있는 에너지를 듬뿍 받을 수 있었고, 뜻을 함께 할 팀원들과 각자의 이야기를 나누며 깊은 유대감도 느낄 수 있었습니다.\n\n오프라인 모음 끝에 이야기해주신 '친절한 전문가'가 될 수 있도록 거듭 노력하겠습니다!",
    highlight: "",
  },
];

const REVIEWS = [
  {
    name: "장**님",
    rating: 5,
    date: "3주 전",
    text: "유튜브시작함에있어서 너무막막하고 많은고민이 있었는데 강의들으면서 하나하나 시작하게 되었어요 아직은 이러한 과정이 쉽진 않지만 꾸준히 노력해서 유튜브를 키워보고싶어요!",
  },
  {
    name: "박**님",
    rating: 5,
    date: "3주 전",
    text: "'뭐라도 해야 하는데' 라는 마음은 누구나 갖고 있지만, 실행할 수 있게 만드는 강의라고 생각합니다. 이제 5주차 강의를 듣고 있으며, 아무것도 모르는 초보도 적용하고 실행할 수 있도록 강의가 구성되어 있습니다. 최근 다양한 짧은 강의가 수 없이 많지만, 비블님 강의는 꾸준하게 성과를 끌어낼 수 있는 기간으로 세팅한 점도 매력적이라고 생각됩니다.",
  },
  {
    name: "허**님",
    rating: 5,
    date: "4주 전",
    text: ".",
  },
  {
    name: "서**님",
    rating: 5,
    date: "1개월 전",
    text: "항상 새로운 관점과 새로운 방법을 실행을 하면서 배우니 주입으로 끝나는 것이 아니라 '내가 했었던 이 방법을 이렇게 적용하면 더 나은 결과가 나올 수 있구나' 라는 깨달음과 함께 공부할 수 있어 너무 좋습니다.\n\n이번 AI 활용과 썸네일 제작 관련해서도 여러 번 복습하면서 내 것으로 만들겠습니다.",
  },
  {
    name: "서**님",
    rating: 5,
    date: "1개월 전",
    text: "초보 유튜버에게 기본부터 차근차근 알려주셔서 너무 감사합니다. 강의보고 실행하며 꾸준히 성장하고 싶습니다🥰",
  },
  {
    name: "전**님",
    rating: 5,
    date: "1개월 전",
    text: "현재까지 대부분 알고 있던 내용들이었으나 도움되거나 다시한번 리마인드하면서 배워가는게 너무 좋습니다.\n\n앞으로 어떤걸 어떻게 알려주실지 너무나 기대가 됩니다 ㅎㅎ",
  },
  {
    name: "마**님",
    rating: 5,
    date: "1개월 전",
    text: "너무너무 좋고 유익한 정보들만 쏙쏙 뽑아서 먹여주는 숟가락 같은 역할을 대표님이 강의를 통해서 해 주시네요 넘너무 너무 좋아요 감사합니다",
  },
];

const TABS = ["클래스 소개", "리뷰", "커리큘럼", "강사 소개"];

export default function TeamBiblPage() {
  const [activeTab, setActiveTab] = useState("클래스 소개");
  const [openWeeks, setOpenWeeks] = useState<string[]>(["1주차"]);
  const [stickyNav, setStickyNav] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        setStickyNav(window.scrollY > navRef.current.offsetTop - 64);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (tab: string) => {
    setActiveTab(tab);
    const el = sectionRefs.current[tab];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleWeek = (week: string) => {
    setOpenWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-2">
        <Link href="/studio/class" className="text-xs text-gray-500 hover:text-gray-300 transition inline-flex items-center gap-1">
          ← 강의 목록
        </Link>
      </div>

      {/* 전체 2열 레이아웃 */}
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── 좌측 콘텐츠 열 ── */}
          <div className="lg:col-span-2">

            {/* 히어로 썸네일 */}
            <div className="rounded-2xl overflow-hidden mb-5 mt-4">
              <Image
                src="/studio/team-bibl/hero-thumbnail.png"
                alt="팀비블 유튜브 프로젝트"
                width={900}
                height={505}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* 제목 & 메타 */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  {"★★★★★"}
                  <span className="text-white font-bold ml-1">5.0</span>
                  <span className="text-gray-500 ml-1">({REVIEWS.length}개의 리뷰)</span>
                </div>
                <span className="w-px h-4 bg-gray-700" />
                <span className="text-xs text-gray-500">동영상 160개 · 총 40주 커리큘럼</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-1">
                팀비블 : 유튜브를 책임지고 실행하는 1:1 컨설팅 프로그램
              </h1>
              <p className="text-gray-400 text-sm">비블 | 김태민 · 입문 이상</p>
            </div>

            {/* 스티키 탭 내비 */}
            <div ref={navRef} className={`border-b border-gray-800 bg-gray-950 -mx-4 px-4 ${stickyNav ? "sticky top-16 z-30" : ""}`}>
              <div className="flex gap-0 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => scrollToSection(tab)}
                    className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      activeTab === tab
                        ? "border-teal-400 text-teal-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 섹션들 */}
            <div className="space-y-12 pt-8">

            {/* 클래스 소개 */}
            <section ref={(el) => { sectionRefs.current["클래스 소개"] = el; }}>
              <h2 className="text-xl font-bold mb-6">클래스 소개</h2>

              {/* 하이라이트 후기 */}
              <div className="space-y-4 mb-8">
                {FEATURED_REVIEWS.map((r, i) => (
                  <div key={`top-feat-${i}`} className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold">{r.title}</h3>
                      <div className="text-amber-400 text-sm tracking-wider">{"★".repeat(r.rating)}</div>
                    </div>
                    <div className="border-t border-gray-700 mb-4" />
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {r.highlight
                        ? r.text.split(r.highlight).map((part, j, arr) =>
                            j < arr.length - 1 ? (
                              <span key={j}>
                                {part}
                                <span className="text-red-500 font-bold">{r.highlight}</span>
                              </span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )
                        : r.text}
                    </p>
                  </div>
                ))}
              {/* 일반 후기 */}
                {REVIEWS.map((r, i) => (
                  <div key={`top-rev-${i}`} className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold">{r.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{r.date}</p>
                      </div>
                      <div className="text-amber-400 text-sm tracking-wider">{"★".repeat(r.rating)}</div>
                    </div>
                    <div className="border-t border-gray-700 mb-4" />
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{r.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-0">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="w-full">
                    <Image
                      src={`/studio/team-bibl/${String(n).padStart(2, "0")}.png`}
                      alt={`팀비블 소개 ${String(n).padStart(2, "0")}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 리뷰 */}
            <section ref={(el) => { sectionRefs.current["리뷰"] = el; }}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold">리뷰</h2>
                <div className="flex items-center gap-1 text-amber-400">
                  {"★★★★★"}
                  <span className="text-white font-bold ml-1">5.0</span>
                </div>
                <span className="text-gray-500 text-sm">{FEATURED_REVIEWS.length + REVIEWS.length}개의 리뷰</span>
              </div>
              {/* 일반 리뷰 */}
              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold">{r.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{r.date}</p>
                      </div>
                      <div className="text-amber-400 text-sm tracking-wider">{"★".repeat(r.rating)}</div>
                    </div>
                    <div className="border-t border-gray-700 mb-4" />
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 커리큘럼 */}
            <section ref={(el) => { sectionRefs.current["커리큘럼"] = el; }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">커리큘럼</h2>
                <span className="text-xs text-gray-500">총 160강 · 40주 커리큘럼</span>
              </div>
              <div className="space-y-2">
                {CURRICULUM.map((section) => (
                  <div key={section.week} className="rounded-xl border border-gray-800 overflow-hidden">
                    <button
                      onClick={() => toggleWeek(section.week)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gray-900 hover:bg-gray-800 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-600/20 border border-teal-600/40 flex items-center justify-center text-teal-400 text-xs font-bold">
                          {section.week.replace("주차", "")}
                        </span>
                        <span className="font-semibold">{section.week}</span>
                        <span className="text-xs text-gray-500">{section.lessons.length}강</span>
                      </div>
                      <span className={`text-gray-400 transition-transform duration-200 ${openWeeks.includes(section.week) ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    {openWeeks.includes(section.week) && (
                      <div className="divide-y divide-gray-800/60">
                        {section.lessons.map((lesson, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-3 bg-gray-950/50">
                            <div className="flex items-center gap-3">
                              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-300">{lesson.title}</span>
                            </div>
                            <span className="text-xs text-gray-500 ml-4 flex-shrink-0">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 강사 소개 */}
            <section ref={(el) => { sectionRefs.current["강사 소개"] = el; }}>
              <h2 className="text-xl font-bold mb-6">강사 소개</h2>
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    <Image src="/studio/instructor.jpg" alt="비블 김태민" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">비블 bibl, 김태민</p>
                    <p className="text-sm text-teal-400">총 65만 구독자 유튜버 · TMK STUDIO 대표</p>
                  </div>
                </div>
                <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                  <div>
                    <p className="text-white font-semibold mb-2">온라인</p>
                    <ul className="space-y-1">
                      <li>· 총 65만 구독자 유튜버</li>
                      <li>· 세계유명 골프정보(24만), 영어키위새(22만), 스윔클래스(8만), 비블bibl(3.5만) 등 다수 채널 운영</li>
                      <li>· 인스타그램 2.7만 @seyugolf · 스레드 1.6만 @bibl_youtube</li>
                      <li>· 쇼핑몰 semogolf 대표</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-2">교육</p>
                    <ul className="space-y-1">
                      <li>· 단국대학교 사범대학 교육과 전공, 차석 졸업</li>
                      <li>· 유튜브 교육 & 컨설팅 TMKLab.com 대표</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-2">사업</p>
                    <ul className="space-y-1">
                      <li>· 개인/기업 유튜브 1:1 컨설팅</li>
                      <li>· 유튜브 채널 대행 TMK STUDIO 운영</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            </div>{/* space-y-12 끝 */}
          </div>{/* 좌측 col-span-2 끝 */}

          {/* ── 우측 sticky 카드 (데스크탑) ── */}
          <div className="hidden lg:block lg:col-span-1 self-start sticky top-24 pt-4">
            <PriceCard />
          </div>

        </div>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 p-4">
        <a
          href="https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/BUXQC"
          className="block w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-center text-base transition"
        >
          수강신청 하기
        </a>
      </div>
      <div className="lg:hidden h-24" />
    </main>
  );
}

function PriceCard() {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="p-6">
        <p className="text-xs text-gray-500 mb-1">10개월 할부 시</p>
        <p className="text-3xl font-black text-white mb-1">월 390,000원</p>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-gray-500">권장 소비자 가격</span>
          <span className="text-sm text-gray-500 line-through">990,000원</span>
        </div>

        <a
          href="https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/BUXQC"
          className="block w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-center text-sm transition mb-3"
        >
          수강신청 하기
        </a>
        <a
          href="http://pf.kakao.com/_beBNn/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium text-center text-sm transition"
        >
          카카오톡 문의
        </a>

        <div className="mt-5 pt-5 border-t border-gray-800 space-y-2">
          {[
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 00-5.916-3.519M9 20H4v-2a4 4 0 015.916-3.519M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0zM3 11a3 3 0 116 0 3 3 0 01-6 0z" />
                </svg>
              ),
              label: "모집 정원", value: "15명 한정",
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              label: "수강 기한", value: "365일",
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ),
              label: "동영상", value: "160개 (총 40주 커리큘럼)",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                {item.icon}{item.label}
              </span>
              <span className="text-gray-300 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
