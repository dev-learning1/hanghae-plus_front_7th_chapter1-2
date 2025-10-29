# TDD 자동화 에이전트 시스템

> 이 프로젝트에 통합된 TypeScript 기반 TDD 자동화 시스템입니다.

## 🎯 특징

- ✅ **Vitest 특화**: Vitest 출력 형식 정확한 파싱
- ✅ **React 특화**: React Testing Library 패턴 자동 인식
- ✅ **스타일 학습**: `src/__tests__/` 코드 스타일 분석 및 적용
- ✅ **자동 분석**: React/TS 특화 오류 분석 및 제안
- ✅ **Watch 모드**: 파일 변경 감지 후 자동 테스트 실행
- ✅ **구조 유지**: 기존 폴더 구조 그대로 유지

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
pnpm add -D tsx chokidar
```

### 2. 스크립트 추가

`package.json`에 다음 스크립트를 추가하세요:

```json
{
  "scripts": {
    "tdd:run": "tsx infra/scripts/run-tdd.ts",
    "tdd:watch": "tsx infra/scripts/watch-tests.ts",
    "tdd:clean": "tsx infra/scripts/cleanup.ts",
    "tdd:report": "cat infra/reports/tdd-agent/latest.md"
  }
}
```

### 3. 실행

```bash
# 한 번 실행
pnpm tdd:run

# Watch 모드 (개발 중 사용 권장)
pnpm tdd:watch

# 리포트 확인
pnpm tdd:report
```

## 📖 사용 가이드

### 기본 워크플로우

1. **테스트 작성** (RED)
   ```bash
   # src/__tests__/unit/easy.myFunction.spec.ts 생성
   ```

2. **TDD 에이전트 실행**
   ```bash
   pnpm tdd:watch
   ```

3. **자동 분석 확인**
   - 실패 원인 자동 분석
   - 수정 제안 제공

4. **구현 작성** (GREEN)
   ```typescript
   // src/utils/myFunction.ts
   export function myFunction() {
     // 구현
   }
   ```

5. **자동 재테스트**
   - Watch 모드가 변경 감지
   - 자동으로 테스트 재실행

6. **리포트 확인**
   ```bash
   pnpm tdd:report
   ```

### Watch 모드 단축키

- `r`: 모든 테스트 재실행
- `c`: 콘솔 클리어
- `q` 또는 `Ctrl+C`: 종료
- `?`: 도움말

## 📊 리포트

테스트 실행 시마다 자동으로 리포트가 생성됩니다:

```
infra/
├── reports/
│   └── tdd-agent/
│       ├── 2025-10-29_10-30-45/
│       │   ├── result.json      # 구조화된 결과
│       │   ├── summary.md       # 요약
│       │   └── evaluation.md    # 품질 평가
│       └── latest.md            # 최신 리포트 링크
└── overview/
    └── tdd-session-summary.md   # 전체 세션 요약
```

## 🔧 고급 기능

### 테스트 패턴 분석

```typescript
import { TestPatternAnalyzer } from './infra/agent/testPatternAnalyzer'

const analyzer = new TestPatternAnalyzer()
const pattern = await analyzer.analyzePatterns()

console.log(pattern)
// {
//   framework: 'vitest',
//   library: 'react-testing-library',
//   style: 'describe-it',
//   ...
// }
```

### 테스트 자동 생성

```typescript
import { TestWriterAgent } from './agents/test-writer'

const agent = new TestWriterAgent()
const test = await agent.generateTest({
  targetFile: 'src/utils/newFunction.ts',
  functionName: 'newFunction',
  testType: 'unit'
})

console.log(test.content)
// 생성된 테스트 코드
```

## 📚 문서

- [전체 가이드](./AGENTS.md)
- [운영 매뉴얼](./docs/TDD-AGENT-OPERATIONS.md)
- [커스터마이징 상세](./CUSTOMIZATION-COMPLETE.md)
- [워크플로우 예제](./infra/examples/)

## 🛠️ 기술 스택

- **Node.js** >= 18
- **TypeScript** 5.x
- **Vitest** 3.x
- **React Testing Library**
- **pnpm**

## 📂 프로젝트 구조

```
.agent/                  # 에이전트 역할 정의
agents/                  # 에이전트 구현
infra/
  ├── agent/            # 핵심 로직
  │   ├── index.ts
  │   ├── testRunner.ts    # Vitest 특화
  │   ├── analyzer.ts      # React/TS 특화
  │   ├── testPatternAnalyzer.ts
  │   └── utils/
  ├── config/           # 설정 (프로젝트 특화)
  ├── scripts/          # 실행 스크립트
  ├── examples/         # 워크플로우 예제
  ├── reports/          # 자동 생성 리포트
  └── overview/         # 세션 요약
```

## 🎓 예제

### 간단한 함수 테스트

```typescript
// src/__tests__/unit/easy.add.spec.ts
import { add } from '../../utils/add'

describe('add', () => {
  it('두 숫자를 더한다', () => {
    expect(add(1, 2)).toBe(3)
  })
})
```

### Hook 테스트

```typescript
// src/__tests__/hooks/easy.useCounter.spec.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '../../hooks/useCounter'

describe('useCounter', () => {
  it('초기값이 0이다', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('증가 버튼을 누르면 1 증가한다', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })
})
```

## 🤝 기여

이 TDD 에이전트 시스템은 프로젝트의 테스트 패턴을 학습하여 최적화되었습니다.

필요에 따라 자유롭게 수정하여 사용하세요:
- `infra/agent/` - 핵심 로직 수정
- `infra/config/tdd.config.ts` - 설정 조정
- `agents/` - 새 에이전트 추가

## 📝 라이센스

MIT License

---

**버전**: 1.0.0 (커스터마이징 완료)  
**마지막 업데이트**: ${new Date().toLocaleString('ko-KR')}

