# 학습된 테스트 스타일 가이드

이 문서는 `src/__tests__` 폴더의 기존 테스트 코드를 분석하여 학습한 작성 스타일과 판명 기준을 설명합니다.

**중요**: 이 가이드는 기존 코드를 **참고**하여 에이전트가 동일한 스타일로 코드를 생성하도록 합니다. 폴더 구조나 파일 위치를 변경하지 않습니다.

## 📚 학습 출처

분석 대상: `src/__tests__/**/*.spec.{ts,tsx}`
- `src/__tests__/hooks/` - Hook 테스트
- `src/__tests__/unit/` - 유닛 테스트
- `src/__tests__/` - Integration 테스트

## 🎯 학습된 스타일

### 1. 테스트 구조 패턴

**사용자 스타일:**
```typescript
describe('기능명', () => {
  it('한글로 명확한 설명', () => {
    // 테스트 코드
  })
})
```

**특징:**
- ✅ `describe` + `it` 구조 사용
- ✅ 테스트 설명은 한글로 명확하게
- ✅ Given-When-Then 주석 없이 암묵적으로 구조화
- ✅ 중첩된 `describe`로 계층 구조

**예제 (학습 소스: `src/__tests__/hooks/easy.useSearch.spec.ts`):**
```typescript
it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => {
  const { result } = renderHook(() => useSearch(mockEvents, currentDate, view))
  expect(result.current.filteredEvents).toEqual(mockEvents)
})
```

### 2. Hook 테스트 패턴

**사용자 스타일:**
```typescript
import { renderHook, act } from '@testing-library/react'

describe('useHookName', () => {
  const mockData = [ /* ... */ ]

  it('초기 상태 검증', () => {
    const { result } = renderHook(() => useHookName(mockData))
    expect(result.current.value).toBeDefined()
  })

  it('상태 업데이트 검증', () => {
    const { result } = renderHook(() => useHookName(mockData))
    
    act(() => {
      result.current.updateFunction('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

**특징:**
- ✅ `renderHook` 사용
- ✅ `act`로 상태 업데이트 래핑
- ✅ Mock 데이터는 `describe` 블록 내부에 정의
- ✅ `result.current`로 Hook 반환값 접근

### 3. 유닛 테스트 패턴

**사용자 스타일:**
```typescript
import { functionName } from '../../utils/fileName'

describe('functionName', () => {
  it('정상 케이스 설명', () => {
    expect(functionName(input)).toBe(expected)
  })

  it('경계값에 대한 설명', () => {
    expect(functionName(edgeCase)).toBe(expected)
  })

  it('에러 케이스 설명', () => {
    expect(() => functionName(invalid)).toThrow()
  })
})
```

**특징:**
- ✅ 간결한 테스트 케이스
- ✅ 정상 → 경계값 → 에러 순서
- ✅ `expect().toBe()` 또는 `expect().toEqual()` 사용

### 4. Integration 테스트 패턴

**사용자 스타일 (학습 소스: `src/__tests__/medium.integration.spec.tsx`):**
```typescript
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../setupTests'

describe('Component Integration', () => {
  it('사용자 인터랙션 시나리오', async () => {
    const user = userEvent.setup()
    
    render(<Component />)
    
    const button = screen.getByRole('button', { name: '버튼명' })
    await user.click(button)
    
    expect(screen.getByText('결과')).toBeInTheDocument()
  })

  it('API 통신 시나리오', async () => {
    server.use(
      http.get('/api/endpoint', () => {
        return HttpResponse.json({ data: 'test' })
      })
    )
    
    render(<Component />)
    
    const result = await screen.findByText('API 결과')
    expect(result).toBeInTheDocument()
  })
})
```

**특징:**
- ✅ `userEvent.setup()` 패턴
- ✅ MSW를 사용한 API 모킹
- ✅ `screen.getByRole`, `screen.getByText` 등 접근성 기반 쿼리
- ✅ `async/await` + `findBy` 비동기 처리

### 5. Mock 데이터 패턴

**사용자 스타일:**
```typescript
const mockEvents: Event[] = [
  {
    id: '1',
    title: '회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 회의',
    location: '회의실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  // ... more mock data
]
```

**특징:**
- ✅ 완전한 타입 정의
- ✅ 실제 데이터와 유사한 realistic 값
- ✅ 여러 케이스를 커버하는 다양한 mock 데이터

### 6. Import 패턴

**사용자 스타일:**
```typescript
// 1. Testing library imports
import { renderHook, act } from '@testing-library/react'

// 2. 테스트 대상 import
import { useSearch } from '../../hooks/useSearch'

// 3. 타입 imports
import { Event } from '../../types'
```

**특징:**
- ✅ Testing library → 테스트 대상 → 타입 순서
- ✅ 상대 경로 사용
- ✅ 그룹별로 빈 줄 구분

## 🔍 코드 판명 기준

### 1. 테스트 실패 분석

**Vitest 출력 패턴:**
```
❯ src/__tests__/hooks/easy.useSearch.spec.ts  (5 tests)
  × 검색어가 비어있을 때 모든 이벤트를 반환해야 한다
    AssertionError: expected [] to deeply equal [...]
```

**분석 기준:**
- ✅ `❯` 기호로 테스트 파일 식별
- ✅ `×` 기호로 실패한 테스트 식별
- ✅ `AssertionError`, `TypeError` 등 오류 타입 분류
- ✅ `expected ... to ...` 패턴으로 예상/실제 값 추출

### 2. React/TypeScript 오류 분류

**학습된 오류 카테고리:**

| 오류 유형 | 판별 패턴 | 원인 추정 |
|----------|----------|----------|
| **syntax-error** | `SyntaxError`, `Unexpected token` | 문법 오류, JSX/TSX 오류 |
| **type-error** | `TypeError`, `cannot read property` | 타입 불일치, undefined 접근 |
| **assertion-failure** | `expected ... to ...`, `toEqual`, `toBe` | 예상값 불일치, 로직 오류 |
| **missing-implementation** | `is not defined`, `Cannot find module` | 미구현 함수/모듈 |
| **timeout** | `timeout`, `exceeded` | 비동기 처리 문제 |
| **integration-failure** | `network`, `fetch`, `API` | MSW 모킹 문제, API 오류 |

### 3. React Testing Library 특화 판명

**DOM 쿼리 실패:**
```
Unable to find an element with the role "button"
```
→ **판명**: 컴포넌트 렌더링 문제 또는 잘못된 쿼리

**Hook 상태 불일치:**
```
Expected: { filteredEvents: [...] }
Received: { filteredEvents: [] }
```
→ **판명**: Hook 로직 오류 또는 상태 업데이트 누락

**비동기 타임아웃:**
```
Timed out in waitFor
```
→ **판명**: `findBy` 사용 필요 또는 MSW 설정 오류

## 🤖 에이전트 적용 방법

### TestRunner Agent
- ✅ Vitest 출력 형식 파싱
- ✅ `❯`, `×` 기호 인식
- ✅ 한글 테스트명 정확한 추출

### Analyzer Agent
- ✅ React/TS 특화 오류 분류
- ✅ 사용자의 테스트 패턴 기반 원인 분석
- ✅ 구체적인 수정 제안 (예: "screen.getByRole 쿼리 확인")

### Test Writer Agent
- ✅ 동일한 스타일로 테스트 생성
  - `describe` + `it` 구조
  - 한글 테스트 설명
  - Hook: `renderHook` + `act`
  - Integration: `userEvent` + MSW
- ✅ Mock 데이터 완전한 타입 정의
- ✅ Import 순서 동일하게 유지

### Implementation Generator Agent
- ✅ 테스트 스타일에 맞는 구현 생성
- ✅ TypeScript strict 모드
- ✅ React Hook 규칙 준수

## 📦 실제 적용

에이전트들은 이 스타일 가이드를 다음과 같이 활용합니다:

1. **TestPatternAnalyzer**가 `src/__tests__/`를 스캔하여 패턴 학습
2. **TestRunner**가 Vitest 출력을 정확히 파싱
3. **Analyzer**가 React/TS 특화 오류 분석
4. **Test Writer**가 동일한 스타일로 새 테스트 생성

**중요**: 이 모든 것은 기존 코드 스타일을 **학습**하고 **적용**하는 것이며, 폴더 구조나 파일 위치를 변경하지 않습니다.

## 🔄 지속적 학습

새로운 테스트가 추가되면 TestPatternAnalyzer가 자동으로 분석하여 패턴을 업데이트합니다:

```typescript
const analyzer = new TestPatternAnalyzer('src/__tests__')
const pattern = await analyzer.analyzePatterns()
// 최신 패턴 반영
```

---

**학습 소스**: `src/__tests__/**/*.spec.{ts,tsx}`  
**적용 대상**: 모든 에이전트의 코드 생성/분석  
**업데이트**: 자동 (새 테스트 추가 시)

