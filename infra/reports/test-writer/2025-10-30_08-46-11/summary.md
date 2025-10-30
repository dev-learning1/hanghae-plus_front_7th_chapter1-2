# Pre-validation Summary

## 결과 개요
- 대상 파일: 10
- 실행 대상: 10
- 총 테스트(it): 1920
- 실행된 테스트(it): 1920
- ✅ expect() 통과: 1179
- ❌ expect() 실패: 741

| 파일 | 총(it) | 통과 | 실패 | 상태 |
| --- | --- | --- | --- | --- |
| src/hooks/useCalendarView.ts | 192 | 117 | 75 | RED |
| src/hooks/useEventForm.ts | 192 | 117 | 75 | RED |
| src/hooks/useEventOperations.ts | 192 | 117 | 75 | RED |
| src/hooks/useNotifications.ts | 192 | 120 | 72 | RED |
| src/hooks/useSearch.ts | 192 | 117 | 75 | RED |
| src/utils/dateUtils.ts | 192 | 119 | 73 | RED |
| src/utils/eventOverlap.ts | 192 | 118 | 74 | RED |
| src/utils/eventUtils.ts | 192 | 119 | 73 | RED |
| src/utils/notificationUtils.ts | 192 | 118 | 74 | RED |
| src/utils/timeValidation.ts | 192 | 117 | 75 | RED |

## 체크리스트
- ✅ describe/it 구조 적용
- ✅ 메타데이터(@intent, @risk-level) 추가
- ✅ 실제 모듈 import 사전 준비
- ✅ Vitest 실행 성공
- ✅ RED 상태 유지(테스트 실패)

## 결론
- ✅ RED 상태를 확인했습니다. GREEN 단계로 진행할 수 있습니다.
