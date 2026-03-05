# Dispatch Wave 1 (Immediate)

## foundation
[오케스트레이터 하달]
- 목표: 랜딩에서 진단으로 들어가는 1차 흐름 완성
- 작업:
  1) Landing/Dashboard CTA를 Diagnosis로 확실히 연결
  2) 글로벌 네비에서 6개 핵심 페이지 직접 이동 가능
  3) 페이지 제목/설명/상태 뱃지 통일
- 완료조건: 클릭만으로 진단 시작 가능

## diagnosis
[오케스트레이터 하달]
- 목표: 결과를 recommendation으로 넘길 수 있는 payload 정리
- 작업:
  1) categoryScores, topGaps 산출
  2) contract 형식으로 저장(localStorage key 고정)
  3) "추천 과정 보기" 버튼으로 recommendation 이동
- 완료조건: recommendation에서 payload 읽기 가능

## recommendation
[오케스트레이터 하달]
- 목표: diagnosis payload 기반 추천 카드 출력
- 작업:
  1) payload 읽기
  2) 추천 카드 + 이유 칩 노출
  3) 신청 버튼을 course-linking으로 연결
- 완료조건: 최소 3개 추천 카드 렌더링
