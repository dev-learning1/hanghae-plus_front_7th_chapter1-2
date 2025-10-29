# 간단한 TDD 워크플로우 예제

이 문서는 TDD 자동화 시스템을 사용하는 간단한 워크플로우를 보여줍니다.

## 시나리오: 새로운 유틸리티 함수 추가

날짜 포맷팅 함수를 추가하는 예제입니다.

### 1단계: 테스트 작성 (RED)

```bash
# 테스트 파일 생성
touch src/__tests__/unit/easy.formatDate.spec.ts
```

```typescript
// src/__tests__/unit/easy.formatDate.spec.ts
import { formatDate } from '../../utils/formatDate'

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷한다', () => {
    // Given
    const date = new Date('2025-10-29')
    
    // When
    const result = formatDate(date, 'YYYY-MM-DD')
    
    // Then
    expect(result).toBe('2025-10-29')
  })

  it('잘못된 날짜에 대해 에러를 발생시킨다', () => {
    // Given
    const invalidDate = new Date('invalid')
    
    // When & Then
    expect(() => formatDate(invalidDate, 'YYYY-MM-DD')).toThrow()
  })
})
```

### 2단계: TDD 에이전트 실행

```bash
# 한 번 실행
pnpm tdd:run

# 또는 Watch 모드로 실행
pnpm tdd:watch
```

**예상 출력:**

```
🚀 TDD 에이전트 시작...

📝 [Red] 테스트 실행 중...
❌ 2개 테스트 실패

🔍 [Analyze] 테스트 실패 분석 중...
┌─────────────────────────────────────────┐
│ 실패 분석                               │
├─────────────────────────────────────────┤
│ 카테고리: missing-implementation        │
│ 심각도: high                            │
│ 원인: formatDate 함수가 존재하지 않음    │
│ 제안: src/utils/formatDate.ts 생성     │
└─────────────────────────────────────────┘
```

### 3단계: 구현 작성 (GREEN)

분석 결과를 바탕으로 구현 파일을 생성합니다:

```typescript
// src/utils/formatDate.ts
export function formatDate(date: Date, format: string): string {
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}
```

### 4단계: 테스트 재실행

```bash
pnpm tdd:run
```

**예상 출력:**

```
🚀 TDD 에이전트 시작...

📝 [Red] 테스트 실행 중...
✅ 2개 테스트 통과

📊 리포트 생성 중...
✅ 리포트 생성 완료: infra/reports/tdd-agent/2025-10-29_10-30-45/summary.md
```

### 5단계: 리포트 확인

```bash
# 최신 리포트 확인
cat infra/reports/tdd-agent/latest.md
```

**리포트 내용:**

```markdown
# TDD 사이클 요약

✅ **상태**: SUCCESS

## 테스트 결과
- 전체: 2개
- 통과: 2개
- 실패: 0개
- 소요 시간: 123ms

## 개선 사항
- 2개의 테스트가 통과했습니다.

## 남은 이슈
- 없음
```

### 6단계: 리팩토링 (선택사항)

테스트가 통과하면 코드를 개선합니다:

```typescript
// src/utils/formatDate.ts
const FORMAT_TOKENS = {
  YYYY: (date: Date) => String(date.getFullYear()),
  MM: (date: Date) => String(date.getMonth() + 1).padStart(2, '0'),
  DD: (date: Date) => String(date.getDate()).padStart(2, '0'),
}

export function formatDate(date: Date, format: string): string {
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  return Object.entries(FORMAT_TOKENS).reduce(
    (formatted, [token, formatter]) => 
      formatted.replace(token, formatter(date)),
    format
  )
}
```

### 7단계: 최종 확인 및 커밋

```bash
# 테스트 재실행
pnpm test

# 모두 통과하면 커밋
git add src/utils/formatDate.ts src/__tests__/unit/easy.formatDate.spec.ts
git commit -m "feat: add formatDate utility function"
```

## 요약

1. **테스트 작성** → 실패 확인
2. **TDD 에이전트 실행** → 실패 분석
3. **구현 작성** → 최소 구현
4. **테스트 재실행** → 통과 확인
5. **리포트 확인** → 품질 검증
6. **리팩토링** → 코드 개선
7. **커밋** → 변경사항 저장

이 워크플로우를 반복하면서 TDD를 체계적으로 진행할 수 있습니다.

