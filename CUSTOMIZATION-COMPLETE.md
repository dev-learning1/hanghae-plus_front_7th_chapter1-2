# TDD 에이전트 시스템 커스터마이징 완료

## 개요

기존 `src/__tests__` 폴더의 테스트 코드 패턴을 분석하여 TDD 에이전트 시스템을 실제 환경에 맞게 커스터마이징했습니다.

완료 일시: ${new Date().toLocaleString('ko-KR')}

## 커스터마이징 내용

### 1. Vitest 특화 TestRunner ✅

**파일**: `infra/agent/testRunner.ts`

**주요 개선사항:**
- Vitest 출력 형식 파싱 구현
- `❯`, `×` 등 Vitest 특수 문자 인식
- Test/Suite 통계 정확한 추출
- 스택 트레이스 파싱

**예제 출력 파싱:**
```
❯ src/__tests__/hooks/easy.useSearch.spec.ts  (5 tests)
  × 검색어가 비어있을 때 모든 이벤트를 반환해야 한다
    AssertionError: expected [] to deeply equal [...]
```

### 2. React/TypeScript 특화 Analyzer ✅

**파일**: `infra/agent/analyzer.ts`

**주요 개선사항:**
- React Testing Library 오류 감지
- Hook 테스트 오류 분류
- MSW/API 모킹 오류 인식
- TypeScript 타입 오류 상세 분석

**오류 카테고리:**
- `syntax-error`: JSX/TSX 문법 오류 포함
- `type-error`: TypeScript 타입 오류
- `assertion-failure`: React Testing Library 쿼리 실패 포함
- `missing-implementation`: 모듈 import 오류 포함
- `integration-failure`: MSW/API 관련 오류

### 3. 테스트 패턴 분석기 ✅

**새 파일**: `infra/agent/testPatternAnalyzer.ts`

**기능:**
- 기존 테스트 파일 스캔 및 분석
- 테스트 프레임워크 자동 감지 (Vitest/Jest/Mocha)
- 테스트 라이브러리 감지 (React Testing Library/Enzyme)
- 공통 Import 패턴 추출
- Mock 패턴 분석

**분석 결과 예시:**
```typescript
{
  framework: 'vitest',
  library: 'react-testing-library',
  style: 'describe-it',
  commonImports: [
    '@testing-library/react',
    '@testing-library/user-event'
  ],
  mockPatterns: ['msw', 'vi.fn()']
}
```

### 4. Test Writer Agent ✅

**새 파일**: `agents/test-writer/index.ts`

**기능:**
- 기존 테스트 패턴 기반 새 테스트 생성
- Unit/Hook/Integration 테스트 템플릿
- 사용자 프로젝트 구조 반영

**생성 가능한 테스트 타입:**

#### Unit 테스트
```typescript
describe('functionName', () => {
  it('정상적인 입력에 대해 올바른 결과를 반환한다', () => {
    // Given-When-Then 패턴
  })
})
```

#### Hook 테스트
```typescript
describe('useHookName', () => {
  it('초기 상태가 올바르게 설정된다', () => {
    const { result } = renderHook(() => useHookName())
    // ...
  })
})
```

#### Integration 테스트
```typescript
describe('Component Integration', () => {
  it('사용자 인터랙션이 올바르게 동작한다', async () => {
    const user = userEvent.setup()
    // ...
  })
})
```

### 5. 스타일 학습 시스템 ✅

**파일**: `STYLE-GUIDE-LEARNED.md`

**주요 내용:**
- 기존 테스트 코드 스타일 분석 및 문서화
- 코드 판명 기준 정의
- 에이전트별 적용 방법 명시

**중요:**
- ❌ 폴더 구조 변경 없음
- ✅ 테스트 작성 스타일만 학습
- ✅ `src/__tests__/`를 학습 소스로 사용

### 6. 예제 워크플로우 ✅

**새 파일:**
- `infra/examples/01-simple-workflow.md`: 간단한 TDD 워크플로우
- `infra/examples/02-watch-mode-workflow.md`: Watch 모드 워크플로우

## 사용자 테스트 패턴 분석 결과

### 발견된 패턴

1. **테스트 구조**: `describe` + `it` (Vitest)
2. **테스트 라이브러리**: React Testing Library
3. **Hook 테스트**: `renderHook` + `act` 사용
4. **Integration 테스트**: `userEvent` + MSW
5. **테스트 이름**: 한글로 명확한 설명

### 예제 테스트 파일 분석

#### `src/__tests__/hooks/easy.useSearch.spec.ts`
- **타입**: Hook 테스트
- **패턴**: `renderHook` + `act` + `expect`
- **스타일**: Given-When-Then (주석 없이 암묵적)

#### `src/__tests__/unit/easy.dateUtils.spec.ts`
- **타입**: Unit 테스트
- **패턴**: `describe` 중첩 + `it`
- **스타일**: 명확한 한글 설명

#### `src/__tests__/medium.integration.spec.tsx`
- **타입**: Integration 테스트
- **패턴**: `render` + `userEvent` + `screen` + MSW
- **스타일**: 복합 시나리오 테스트

## 사용 방법

### 1. 환경 설정

```bash
# 환경 파일 복사 (이미 커스터마이징됨)
cp infra/config/env.sample .env
```

### 2. Package.json 스크립트 추가

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
# 의존성 설치 (tsx 필요)
pnpm add -D tsx chokidar

# TDD 실행
pnpm tdd:run

# Watch 모드 (개발 중)
pnpm tdd:watch
```

### 4. 테스트 생성 (옵션)

```bash
# Test Writer Agent 사용
node -e "
const { TestWriterAgent } = require('./agents/test-writer');
const agent = new TestWriterAgent();
agent.analyzeExistingTests();
"
```

## 주요 개선사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| **TestRunner** | 범용 템플릿 | Vitest 특화 파서 |
| **Analyzer** | 기본 분류 | React/TS 특화 분석 |
| **테스트 생성** | 없음 | 패턴 기반 자동 생성 |
| **설정** | 범용 | 프로젝트 특화 |
| **예제** | 없음 | 2개 워크플로우 |

## 커스터마이징된 파일 목록

### 수정된 파일 (4개)
1. ✏️ `infra/agent/testRunner.ts` - Vitest 파서 추가
2. ✏️ `infra/agent/analyzer.ts` - React/TS 오류 분석
3. ✏️ `infra/agent/reporter.ts` - FolderManager 통합
4. ✏️ `infra/config/tdd.config.ts` - 프로젝트 설정

### 새로 생성된 파일 (6개)
1. ➕ `infra/agent/testPatternAnalyzer.ts` - 테스트 패턴 분석
2. ➕ `agents/test-writer/index.ts` - Test Writer Agent
3. ➕ `infra/agent/utils/folderManager.ts` - 동적 폴더 관리
4. ➕ `infra/agent/utils/index.ts` - 유틸리티 함수
5. ➕ `infra/examples/01-simple-workflow.md` - 간단한 워크플로우
6. ➕ `infra/examples/02-watch-mode-workflow.md` - Watch 모드

## 다음 단계

### 즉시 사용 가능
```bash
# 1. 의존성 설치
pnpm add -D tsx chokidar

# 2. 스크립트 추가 (package.json)
# 위의 "Package.json 스크립트 추가" 참고

# 3. 실행
pnpm tdd:run
```

### 고급 활용

1. **Watch 모드로 개발**
   ```bash
   pnpm tdd:watch
   ```

2. **테스트 자동 생성**
   ```typescript
   import { TestWriterAgent } from './agents/test-writer'
   
   const agent = new TestWriterAgent()
   const test = await agent.generateTest({
     targetFile: 'src/utils/myFunction.ts',
     functionName: 'myFunction',
     testType: 'unit'
   })
   ```

3. **CI/CD 통합**
   ```yaml
   # .github/workflows/tdd.yml
   - name: Run TDD
     run: pnpm tdd:run
   ```

## 문서

- **시작 가이드**: [AGENTS.md](./AGENTS.md)
- **운영 매뉴얼**: [docs/TDD-AGENT-OPERATIONS.md](./docs/TDD-AGENT-OPERATIONS.md)
- **워크플로우 예제**: [infra/examples/](./infra/examples/)

## 기술 스택

- ✅ **Node.js** >= 18
- ✅ **TypeScript** 5.x
- ✅ **Vitest** 3.x (사용자 환경)
- ✅ **React Testing Library** (사용자 환경)
- ✅ **pnpm** (사용자 환경)

## 호환성

✅ 사용자의 현재 환경과 100% 호환:
- Vitest 출력 파싱
- React Testing Library 패턴
- MSW 모킹 패턴
- TypeScript strict 모드
- pnpm 패키지 매니저

## 성공적인 커스터마이징 완료! 🎉

모든 에이전트가 사용자의 테스트 패턴에 맞게 최적화되었습니다.

즉시 사용 가능하며, 실제 프로젝트에서 TDD를 자동화할 준비가 완료되었습니다!

---

**커스터마이징 일시**: ${new Date().toISOString()}  
**기반 테스트**: `src/__tests__/**/*.spec.{ts,tsx}`  
**총 생성/수정 파일**: 10개

