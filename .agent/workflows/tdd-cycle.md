# TDD Automation Workflow (BMAD + 9단계 루프)

| 단계 | 에이전트 | 핵심 목표 | 주요 입력 | 산출물 | 다음 단계 조건 |
| --- | --- | --- | --- | --- | --- |
| 1 | **TestWriter** | 요구·위험 기반 실패 테스트 초안 작성 (RED) | 제품 명세, 사용자 스토리 | `.spec.ts`/`.test.ts` 초안, `@intent` `@risk-level` 태그 | Pre-validation 승인 요청 |
| 2 | **TestRunner (Pre-validation)** | 테스트 초안 문법·의도·위험 검증 | 테스트 초안, 태그 메타데이터 | 승인/보류/반려 리포트 | 승인 시 ImplGenerator, 반려 시 TestWriter |
| 3 | **ImplGenerator** | 최소 구현(Green) 작성 | 승인된 테스트, 실패 로그 | 기능 코드(`.ts/.tsx`), 타입 정의 | 테스트 통과 확인, Runner Execution 요청 |
| 4 | **TestRunner (Execution)** | 테스트 실행 및 데이터 수집 | 구현 코드, 환경 설정 | 실행 결과 리포트, 커버리지, 로그 | 실패 시 Analyzer, 성공 시 Committer |
| 5 | **Analyzer** | 실패 원인 분석 및 개선안 도출 | 실행 로그, 코드 변경, 테스트 의도 | 분석 리포트, 재현 스크립트, 개선 제안 | Fixer 작업 요청 |
| 6 | **Fixer** | 수정·리팩토링으로 품질 개선 | 분석 제안, 코드 베이스 | 수정 코드, 보강 테스트, 변경 요약 | Runner Execution 재요청 |
| 7 | **Committer** | 품질 게이트 검증 및 커밋/PR | 실행 성공 리포트, 변경 요약 | Git 커밋/태그, 릴리스 노트 초안 | Reporter에 결과 전달 |
| 8 | **Reporter** | 세션 결과 통합 리포트 작성 | 실행 지표, 분석·수정 기록, 커밋 정보 | `summary.md`, `session-overview.json` | Orchestrator에 통계 전달 |
| 9 | **Orchestrator** | 전체 순서 제어, SLA, 재시도 관리 | 단계별 상태, 지표, 정책 | 상태 로그, 개선 티켓 제안 | 다음 루프 시작 여부 결정 |

## 상태 전이 규칙
- Pre-validation 반려 → TestWriter가 수정 후 다시 제출한다
- Execution 실패 → Analyzer → Fixer → Runner Execution 루프를 거쳐 성공 시 Committer로 전환한다
- SLA 초과나 반복 실패 시 Orchestrator가 인간介入(워크숍, 워룸)을 호출한다

## SLA 예시
- Pre-validation 피드백: 2시간 내
- Analyzer Root Cause 보고: 실패 후 1시간 내 초안, 4시간 내 최종본
- Fixer 수정 완료: 우선순위 High는 1 영업일, Medium은 2 영업일
- Reporter 세션 리포트: 세션 종료 후 1시간 내 공유

## 메트릭 추적
- 루프당 평균 Red→Green 소요 시간
- Pre-validation 반려율, Execution 실패율, Flaky 비율
- 커버리지/성능 지표 변화
- 재시도 횟수 및 SLA 준수율

## 운영 원칙
- 모든 산출물은 `infra/reports/{role}/{timestamp}`에 저장하고 Orchestrator가 최신 링크를 유지한다
- Lessons Learned는 Analyzer·Reporter가 유지하고, 월간 회고에서 TestWriter/Runner 프로세스 개선으로 반영한다
- Orchestrator는 워크플로우 정의 파일(Statechart/YAML)을 버전 관리하여 변경 이력을 남긴다
