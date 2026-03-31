#!/usr/bin/env python3
"""bibl lab 서비스 소개서 PDF 생성 (KG이니시스 심사 제출용)"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# Register Korean font
pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))

BLUE = HexColor('#2563EB')
DARK = HexColor('#1E293B')
GRAY = HexColor('#64748B')
LIGHT_BG = HexColor('#F1F5F9')
WHITE = HexColor('#FFFFFF')
GREEN = HexColor('#059669')

# Styles
title_style = ParagraphStyle('Title', fontName='HYGothic-Medium', fontSize=24, textColor=DARK, alignment=TA_CENTER, leading=32)
subtitle_style = ParagraphStyle('Subtitle', fontName='HYSMyeongJo-Medium', fontSize=12, textColor=GRAY, alignment=TA_CENTER, leading=18)
heading_style = ParagraphStyle('Heading', fontName='HYGothic-Medium', fontSize=16, textColor=BLUE, spaceAfter=8, spaceBefore=16, leading=22)
subheading_style = ParagraphStyle('SubHeading', fontName='HYGothic-Medium', fontSize=13, textColor=DARK, spaceAfter=6, spaceBefore=10, leading=18)
body_style = ParagraphStyle('Body', fontName='HYSMyeongJo-Medium', fontSize=10, textColor=DARK, leading=16, alignment=TA_JUSTIFY, spaceAfter=4)
bullet_style = ParagraphStyle('Bullet', fontName='HYSMyeongJo-Medium', fontSize=10, textColor=DARK, leading=16, leftIndent=16, spaceAfter=3)
small_style = ParagraphStyle('Small', fontName='HYSMyeongJo-Medium', fontSize=9, textColor=GRAY, leading=14, alignment=TA_CENTER)
emphasis_style = ParagraphStyle('Emphasis', fontName='HYGothic-Medium', fontSize=11, textColor=GREEN, leading=16, spaceAfter=4)

def build_pdf():
    output_path = '/Users/taemin/Downloads/youtube-analysis/bibl_lab_서비스소개서.pdf'
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=25*mm, rightMargin=25*mm,
        topMargin=25*mm, bottomMargin=25*mm
    )

    story = []

    # ── 표지 ──
    story.append(Spacer(1, 60*mm))
    story.append(Paragraph('bibl lab', title_style))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph('유튜브 키워드 . 채널 분석 도구', ParagraphStyle('st', fontName='HYGothic-Medium', fontSize=14, textColor=BLUE, alignment=TA_CENTER, leading=20)))
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width='40%', thickness=1, color=BLUE, spaceBefore=0, spaceAfter=0, hAlign='CENTER'))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('서비스 소개서', ParagraphStyle('st2', fontName='HYGothic-Medium', fontSize=18, textColor=DARK, alignment=TA_CENTER, leading=24)))
    story.append(Spacer(1, 30*mm))
    story.append(Paragraph('세모골프', subtitle_style))
    story.append(Paragraph('사업자등록번호: 315-47-01018', small_style))
    story.append(Paragraph('https://www.bibllab.com', small_style))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph('2026년 3월', small_style))

    story.append(PageBreak())

    # ── 1. 서비스 개요 ──
    story.append(Paragraph('1. 서비스 개요', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        'bibl lab은 유튜브 크리에이터와 1인 기업가를 위한 데이터 분석 SaaS 플랫폼입니다. '
        'YouTube Data API를 활용하여 영상 및 채널 데이터를 수집하고 분석하며, '
        '콘텐츠 기획에 필요한 인사이트를 제공합니다.', body_style))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        '크리에이터가 자신의 콘텐츠 전략을 수립하고, 트렌드를 파악하며, '
        '자체 채널의 성과를 분석할 수 있도록 돕는 데이터 기반 의사결정 도구입니다.', body_style))

    story.append(Spacer(1, 5*mm))

    # 핵심 가치 표
    core_data = [
        ['서비스 유형', '구분', '내용'],
        ['서비스 형태', '', 'SaaS (Software as a Service)'],
        ['핵심 기능', '', '유튜브/SNS 데이터 분석 및 인사이트 제공'],
        ['타겟 고객', '', '유튜브 크리에이터, 1인 미디어, 콘텐츠 기획자'],
        ['수익 모델', '', '월 구독형 정기결제'],
        ['서비스 URL', '', 'https://www.bibllab.com'],
    ]
    t = Table(core_data, colWidths=[80, 0, 300])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'HYGothic-Medium'),
        ('FONTNAME', (0,1), (-1,-1), 'HYSMyeongJo-Medium'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('BACKGROUND', (0,1), (0,-1), LIGHT_BG),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('SPAN', (1,0), (1,0)),
    ]))
    story.append(t)

    # ── 2. 주요 기능 ──
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('2. 주요 기능 상세', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))

    features = [
        ('영상 찾기 (영상 검색)', [
            '키워드 기반 유튜브 영상 검색 기능',
            '조회수, 좋아요, 댓글 수 등 성과 데이터 분석',
            '트렌드 키워드 발굴을 통한 콘텐츠 기획 지원',
            '사용자가 자신의 콘텐츠 주제를 탐색하기 위한 리서치 도구',
        ]),
        ('채널 찾기 (채널 검색)', [
            '유튜브 채널 검색 및 성장 데이터 분석',
            '구독자 수, 업로드 빈도, 평균 조회수 등 채널 지표 비교',
            '벤치마킹을 위한 경쟁 채널 분석',
            '유사 분야 채널의 콘텐츠 전략 파악 지원',
        ]),
        ('수집한 영상', [
            '사용자가 관심 있는 영상을 저장하고 분류',
            '콘텐츠 리서치 자료를 체계적으로 관리',
            '저장된 영상의 성과 데이터 추이 확인',
        ]),
        ('내 채널 분석', [
            '자신의 유튜브 채널 성과를 대시보드로 확인',
            '영상별 성과 추이, 구독자 변화 등 자체 채널 운영 인사이트',
            'YouTube Analytics API 연동을 통한 정확한 데이터 제공',
        ]),
        ('스레드 검색 (Threads 검색)', [
            'Meta Threads 플랫폼의 콘텐츠 트렌드 검색',
            'SNS 트렌드 파악을 통한 콘텐츠 아이디어 발굴 지원',
            'Threads API를 활용한 공개 게시물 데이터 분석',
            '크리에이터의 멀티플랫폼 콘텐츠 전략 수립 지원',
        ]),
    ]

    for fname, bullets in features:
        story.append(Paragraph(fname, subheading_style))
        for b in bullets:
            story.append(Paragraph(f'- {b}', bullet_style))
        story.append(Spacer(1, 2*mm))

    story.append(PageBreak())

    # ── 3. 타겟 고객 ──
    story.append(Paragraph('3. 타겟 고객', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))

    targets = [
        ['대상', '활용 목적'],
        ['유튜브 크리에이터', '자신의 채널 성과 분석, 콘텐츠 기획을 위한 트렌드 파악'],
        ['1인 미디어 사업자', '채널 운영 전략 수립, 경쟁 채널 벤치마킹'],
        ['콘텐츠 기획자', '콘텐츠 아이디어 발굴, 시장 트렌드 리서치'],
        ['기업 마케팅 담당자', '자사 유튜브 채널 운영을 위한 데이터 분석 (자사 채널 운영 목적)'],
    ]
    t2 = Table(targets, colWidths=[130, 310])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'HYGothic-Medium'),
        ('FONTNAME', (0,1), (-1,-1), 'HYSMyeongJo-Medium'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('BACKGROUND', (0,1), (0,-1), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t2)

    # ── 4. 바이럴 마케팅과의 차이점 (핵심) ──
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph('4. 바이럴 마케팅 서비스와의 차이점', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        'bibl lab은 바이럴 마케팅 대행 서비스가 아닙니다. '
        '아래와 같이 바이럴 마케팅 서비스와 명확히 구분됩니다.', emphasis_style))
    story.append(Spacer(1, 3*mm))

    diff_data = [
        ['구분', 'bibl lab (데이터 분석 도구)', '바이럴 마케팅 서비스'],
        ['서비스 유형', '데이터 분석 SaaS', '광고/홍보 대행'],
        ['주요 기능', '공개 데이터 분석 및\n인사이트 제공', '타인 계정을 통한\n광고/홍보 집행'],
        ['인플루언서\n섭외/매칭', '제공하지 않음', '핵심 기능'],
        ['SNS 조작 기능\n(자동 댓글 등)', '제공하지 않음', '일부 서비스 제공'],
        ['데이터 출처', 'YouTube Data API,\nThreads API (공개 데이터)', '비공개 네트워크'],
        ['사용 목적', '자신의 콘텐츠 기획 및\n채널 운영 개선', '타사 제품/서비스의\n홍보 및 광고'],
    ]
    t3 = Table(diff_data, colWidths=[90, 175, 175])
    t3.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'HYGothic-Medium'),
        ('FONTNAME', (0,1), (-1,-1), 'HYSMyeongJo-Medium'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('BACKGROUND', (0,1), (0,-1), LIGHT_BG),
        ('BACKGROUND', (1,1), (1,-1), HexColor('#ECFDF5')),  # green tint for bibl lab
        ('BACKGROUND', (2,1), (2,-1), HexColor('#FEF2F2')),  # red tint for viral
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ]))
    story.append(t3)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(
        'bibl lab은 순수하게 공개된 유튜브/스레드 데이터를 분석하여, '
        '콘텐츠 기획자가 자신의 콘텐츠를 개선하는 데 활용하는 데이터 분석 도구입니다. '
        '타인의 SNS 계정을 이용한 광고/홍보 대행, 인플루언서 섭외/매칭, '
        '자동 댓글/팔로우 등의 SNS 조작 기능은 일체 제공하지 않습니다.', body_style))

    story.append(PageBreak())

    # ── 5. 수익 모델 ──
    story.append(Paragraph('5. 수익 모델', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph('월 구독형 SaaS 모델로 운영되며, 플랜별 기능과 검색 횟수에 차이가 있습니다.', body_style))
    story.append(Spacer(1, 3*mm))

    plan_data = [
        ['플랜', '월 요금 (VAT 포함)', '주요 기능'],
        ['Free', '무료', '기본 영상 검색 (제한적)'],
        ['Starter', '49,000원/월', '영상/채널 검색, 수집 기능'],
        ['Pro', '199,000원/월', '전체 기능 + 고급 분석'],
        ['Business', '490,000원/월', '전체 기능 + 팀 협업 + 우선 지원'],
    ]
    t4 = Table(plan_data, colWidths=[80, 130, 230])
    t4.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'HYGothic-Medium'),
        ('FONTNAME', (0,1), (-1,-1), 'HYSMyeongJo-Medium'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('BACKGROUND', (0,1), (0,-1), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
    ]))
    story.append(t4)

    # ── 6. 사업자 정보 ──
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph('6. 사업자 정보', heading_style))
    story.append(HRFlowable(width='100%', thickness=0.5, color=BLUE, spaceBefore=2, spaceAfter=8))

    info_data = [
        ['항목', '내용'],
        ['상호', '세모골프'],
        ['대표자', '김태민'],
        ['사업자등록번호', '315-47-01018'],
        ['통신판매업신고', '제2023-수원권선-1549호'],
        ['업종', '전자상거래 소매업 / 1인미디어콘텐츠창작자'],
        ['사업장 주소', '경기도 수원시 권선구 세화로 151번길 29-2 1층 (우)16619'],
        ['고객 문의', 'bibl.content.official@gmail.com / 070-8027-2532'],
        ['서비스 URL', 'https://www.bibllab.com'],
    ]
    t5 = Table(info_data, colWidths=[120, 320])
    t5.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'HYGothic-Medium'),
        ('FONTNAME', (0,1), (-1,-1), 'HYSMyeongJo-Medium'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('BACKGROUND', (0,1), (0,-1), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t5)

    # 하단 안내
    story.append(Spacer(1, 15*mm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=8))
    story.append(Paragraph(
        '본 서비스 소개서는 전자결제 심사를 위해 작성되었습니다.', small_style))
    story.append(Paragraph(
        'bibl lab - 유튜브 키워드/채널 분석 도구 | https://www.bibllab.com', small_style))

    doc.build(story)
    print(f'PDF 생성 완료: {output_path}')

if __name__ == '__main__':
    build_pdf()
