# Test Writer Scenario Backlog

본 문서는 `src/hooks` 및 `src/utils` 모듈을 기준으로 RED 단계 테스트 시나리오를 준비하기 위한 참고용 백로그입니다. 구현 코드는 참고만 하며 직접 수정하지 않습니다.

## Hooks

### useCalendarView
- 월/주 뷰 전환 시 상태 변화 시나리오 (기존 테스트 참고)
- 공휴일 데이터 동기화 및 네비게이션 엣지 케이스 (윤년, 월경계)
- 비정상 입력(알 수 없는 view) 처리 확인

### useEventForm
- 초기 폼 상태(기본값, 필수 필드)
- 필드 업데이트(제목, 장소, 반복 옵션 등)와 검증 오류 발생 흐름
- 제출 핸들러 호출 시 성공/실패 분기

### useEventOperations
- 이벤트 생성/업데이트/삭제 호출 시 스피너 및 상태 전이
- API 실패 시 에러 메시지 노출 여부
- 동시 수정 충돌 처리

### useNotifications
- 알림 enable/disable 토글 흐름
- 새로운 알림 수신 시 큐 업데이트
- 만료 시간 경과 후 자동 제거

### useSearch
- 검색어 입력/초기화, 결과 필터링 시나리오
- Debounce 타이밍, 연속 입력 처리
- API 실패 및 빈 결과 처리

## Utils

### dateUtils
- 날짜 포맷 변환, 범위 계산, 주/월 경계 처리
- 잘못된 날짜 입력 시 예외 처리

### eventOverlap
- 겹치는 이벤트 검출 로직(경계 포함/불포함 케이스)
- 하루 내 다중 이벤트 정렬

### eventUtils
- 이벤트 필터링, 정렬 옵션별 결과 확인
- 파생 데이터(예: 기간, 라벨) 계산 검증

### notificationUtils
- 알림 생성/파싱 로직, 우선순위 구분
- 만료 처리 및 정리 함수 작동 여부

### timeValidation
- 시/분 단위 유효성 검사, 24시간 경계
- 시작 시간이 종료 시간 이후인 경우 오류 발생

---
- 실제 테스트 파일 위치: `infra/generated-tests/hooks/test-writer/**`, `infra/generated-tests/unit/test-writer/**`
- 각 시나리오는 `@intent`, `@risk-level` 태그와 함께 `describe ... it ...` 형태로 RED 테스트를 작성합니다.
