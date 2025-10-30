# Pre-validation Summary

## 결과 개요
- 대상 파일: 10
- 실행된 대상: 10
- 총 테스트: 203 (통과 120 / 실패 83)
- 총 실행 시간(ms): 800976

| 파일 | 총 | 통과 | 실패 | 상태 |
| --- | --- | --- | --- | --- |
| src/hooks/useCalendarView.ts | 17 | 12 | 5 | RED |
| src/hooks/useEventForm.ts | 39 | 12 | 27 | RED |
| src/hooks/useEventOperations.ts | 15 | 12 | 3 | RED |
| src/hooks/useNotifications.ts | 15 | 12 | 3 | RED |
| src/hooks/useSearch.ts | 18 | 12 | 6 | RED |
| src/utils/dateUtils.ts | 15 | 12 | 3 | RED |
| src/utils/eventOverlap.ts | 15 | 12 | 3 | RED |
| src/utils/eventUtils.ts | 39 | 12 | 27 | RED |
| src/utils/notificationUtils.ts | 15 | 12 | 3 | RED |
| src/utils/timeValidation.ts | 15 | 12 | 3 | RED |

## 체크리스트
- [x] describe/it 구조 적용
- [x] 메타데이터(@intent, @risk-level) 추가
- [x] 실제 모듈 import 사전 준비
- [x] Vitest 실행 성공
- [x] RED 상태 유지(테스트 실패)

## 결론
- [x] RED 상태를 확인했습니다. GREEN 단계로 진행할 수 있습니다.
