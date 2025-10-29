# Watch 모드 워크플로우 예제

Watch 모드를 사용하면 파일 변경 시 자동으로 TDD 사이클이 실행됩니다.

## 시나리오: Hook 개발

`useEventFilter`라는 새로운 Hook을 개발하는 예제입니다.

### 1단계: Watch 모드 시작

```bash
pnpm tdd:watch
```

**출력:**

```
╔════════════════════════════════════════╗
║                                        ║
║     TDD Watch 모드                     ║
║     파일 변경을 감지합니다             ║
║                                        ║
╚════════════════════════════════════════╝

👀 파일 변경 감지 중...
감시 패턴: [ 'src/**/*.ts', 'src/**/*.tsx', 'src/__tests__/**/*.spec.ts' ]

단축키:
  r - 모든 테스트 재실행
  c - 콘솔 클리어
  q - 종료
  ? - 도움말
```

### 2단계: 테스트 파일 생성

```bash
# 새 터미널에서
touch src/__tests__/hooks/easy.useEventFilter.spec.ts
```

**자동으로 감지 및 분석:**

```
📝 1개 파일 변경 감지:
  - src/__tests__/hooks/easy.useEventFilter.spec.ts

🧪 테스트 실행 중...
⚠️  테스트 파일이 비어있습니다.
```

### 3단계: 테스트 작성

```typescript
// src/__tests__/hooks/easy.useEventFilter.spec.ts
import { renderHook, act } from '@testing-library/react'
import { useEventFilter } from '../../hooks/useEventFilter'
import { Event } from '../../types'

const mockEvents: Event[] = [
  {
    id: '1',
    title: '회의',
    category: '업무',
    date: '2025-10-29',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '2',
    title: '운동',
    category: '개인',
    date: '2025-10-29',
    startTime: '18:00',
    endTime: '19:00',
    description: '',
    location: '',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
]

describe('useEventFilter', () => {
  it('초기 상태에서 모든 이벤트를 반환한다', () => {
    const { result } = renderHook(() => useEventFilter(mockEvents))

    expect(result.current.filteredEvents).toEqual(mockEvents)
  })

  it('카테고리로 필터링할 수 있다', () => {
    const { result } = renderHook(() => useEventFilter(mockEvents))

    act(() => {
      result.current.setCategory('업무')
    })

    expect(result.current.filteredEvents).toHaveLength(1)
    expect(result.current.filteredEvents[0].title).toBe('회의')
  })
})
```

**저장 시 자동 실행:**

```
📝 1개 파일 변경 감지:
  - src/__tests__/hooks/easy.useEventFilter.spec.ts

🧪 테스트 실행 중...

❌ 2개 테스트 실패

🔍 분석 중...
┌─────────────────────────────────────────┐
│ 실패: missing-implementation            │
│ 파일: hooks/easy.useEventFilter.spec.ts │
│ 원인: useEventFilter가 존재하지 않음     │
│ 제안: src/hooks/useEventFilter.ts 생성  │
└─────────────────────────────────────────┘

👀 변경 감지 대기 중...
```

### 4단계: Hook 구현

```typescript
// src/hooks/useEventFilter.ts
import { useState, useMemo } from 'react'
import { Event } from '../types'

export function useEventFilter(events: Event[]) {
  const [category, setCategory] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    if (!category) {
      return events
    }
    return events.filter(event => event.category === category)
  }, [events, category])

  return {
    filteredEvents,
    setCategory,
  }
}
```

**저장 시 자동 실행:**

```
📝 1개 파일 변경 감지:
  - src/hooks/useEventFilter.ts

🧪 테스트 실행 중...

✅ 2개 테스트 통과

📊 리포트 생성 중...
✅ 완료 (234ms)

👀 변경 감지 대기 중...
```

### 5단계: 추가 테스트 작성

```typescript
// src/__tests__/hooks/easy.useEventFilter.spec.ts (추가)
  it('카테고리를 변경하면 필터링 결과가 업데이트된다', () => {
    const { result } = renderHook(() => useEventFilter(mockEvents))

    act(() => {
      result.current.setCategory('업무')
    })

    expect(result.current.filteredEvents).toHaveLength(1)

    act(() => {
      result.current.setCategory('개인')
    })

    expect(result.current.filteredEvents).toHaveLength(1)
    expect(result.current.filteredEvents[0].title).toBe('운동')
  })

  it('카테고리를 null로 설정하면 모든 이벤트를 반환한다', () => {
    const { result } = renderHook(() => useEventFilter(mockEvents))

    act(() => {
      result.current.setCategory('업무')
    })

    act(() => {
      result.current.setCategory(null)
    })

    expect(result.current.filteredEvents).toEqual(mockEvents)
  })
```

**저장 시 자동 실행:**

```
📝 1개 파일 변경 감지:
  - src/__tests__/hooks/easy.useEventFilter.spec.ts

🧪 테스트 실행 중...

✅ 4개 테스트 통과

📊 리포트 생성 중...
✅ 완료 (189ms)

👀 변경 감지 대기 중...
```

### 6단계: 리팩토링

```typescript
// src/hooks/useEventFilter.ts (개선)
import { useState, useMemo, useCallback } from 'react'
import { Event } from '../types'

export interface UseEventFilterReturn {
  filteredEvents: Event[]
  category: string | null
  setCategory: (category: string | null) => void
  clearFilter: () => void
}

export function useEventFilter(events: Event[]): UseEventFilterReturn {
  const [category, setCategory] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    if (!category) {
      return events
    }
    return events.filter(event => event.category === category)
  }, [events, category])

  const clearFilter = useCallback(() => {
    setCategory(null)
  }, [])

  return {
    filteredEvents,
    category,
    setCategory,
    clearFilter,
  }
}
```

**저장 시 자동 실행:**

```
📝 1개 파일 변경 감지:
  - src/hooks/useEventFilter.ts

🧪 테스트 실행 중...

✅ 4개 테스트 통과

📊 리포트 생성 중...
✅ 완료 (201ms)

👀 변경 감지 대기 중...
```

### 7단계: Watch 모드 종료 및 커밋

**키보드:**
- `q` 또는 `Ctrl+C` 눌러서 Watch 모드 종료

```bash
# 최종 테스트 실행
pnpm test

# 커밋
git add src/hooks/useEventFilter.ts src/__tests__/hooks/easy.useEventFilter.spec.ts
git commit -m "feat: add useEventFilter hook for filtering events by category"
```

## Watch 모드 장점

1. **즉각적인 피드백**: 파일 저장 시 즉시 테스트 실행
2. **생산성 향상**: 수동으로 명령어 입력 불필요
3. **빠른 반복**: Red-Green-Refactor 사이클을 빠르게 반복
4. **실시간 모니터링**: 코드 변경의 영향을 즉시 확인

## 단축키 활용

- **`r`**: 모든 테스트 재실행
  ```
  r 키 입력
  
  🔄 모든 테스트를 재실행합니다...
  ✅ 전체 4개 테스트 통과
  ```

- **`c`**: 콘솔 클리어
  ```
  c 키 입력
  
  ✨ 콘솔을 클리어했습니다.
  ```

- **`?`**: 도움말 표시
  ```
  ? 키 입력
  
  단축키:
    r - 모든 테스트 재실행
    c - 콘솔 클리어
    q - 종료
    ? - 도움말
  ```

## 권장 워크플로우

1. Watch 모드 시작
2. 테스트 파일 작성
3. 구현 파일 작성
4. 자동 피드백 확인
5. 리팩토링 (테스트 계속 통과하는지 확인)
6. Watch 모드 종료 후 커밋

Watch 모드는 개발 중 가장 생산적인 방법입니다!

