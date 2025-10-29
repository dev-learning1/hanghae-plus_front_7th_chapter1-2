# 에이전트 가이드

## 에이전트 시스템 개요

TDD 자동화 시스템은 4가지 주요 에이전트로 구성됩니다.

## 1. Test Writer Agent

### 역할
테스트 케이스를 작성하고 관리합니다.

### 주요 기능
- 요구사항 분석
- 테스트 시나리오 생성
- Given-When-Then 패턴 적용
- Edge case 식별

### 사용 방법

```typescript
import { TestWriterAgent } from './agents/test-writer'

const agent = new TestWriterAgent({
  requirements: '사용자 로그인 기능 구현',
  context: {
    domain: 'authentication',
    existingTests: []
  }
})

const testCode = await agent.generateTests()
```

### 생성되는 테스트 예시

```typescript
describe('UserAuthService', () => {
  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      // Given
      const credentials = { email: 'test@example.com', password: 'password123' }
      
      // When
      const result = await authService.login(credentials)
      
      // Then
      expect(result.token).toBeDefined()
      expect(result.user.email).toBe(credentials.email)
    })

    it('should throw error when credentials are invalid', async () => {
      // Given
      const credentials = { email: 'test@example.com', password: 'wrong' }
      
      // When & Then
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials')
    })
  })
})
```

## 2. Implementation Generator Agent

### 역할
테스트를 통과시키기 위한 구현 코드를 생성합니다.

### 주요 기능
- 실패한 테스트 분석
- 최소 구현 생성
- 타입 안정성 보장
- 리팩토링 제안

### 사용 방법

```typescript
import { ImplGeneratorAgent } from './agents/impl-generator'

const agent = new ImplGeneratorAgent({
  testFile: 'src/__tests__/auth.test.ts',
  failures: testFailures
})

const implementation = await agent.generateImplementation()
```

### 생성 전략

#### 1. Stub 생성
테스트를 통과시키는 최소한의 코드만 생성:

```typescript
export class UserAuthService {
  async login(credentials: Credentials): Promise<AuthResult> {
    throw new Error('Not implemented')
  }
}
```

#### 2. 점진적 구현
각 테스트를 하나씩 통과시키며 기능 추가:

```typescript
export class UserAuthService {
  async login(credentials: Credentials): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(credentials.email)
    
    if (!user || !await this.verifyPassword(credentials.password, user.password)) {
      throw new Error('Invalid credentials')
    }
    
    const token = await this.generateToken(user)
    
    return { token, user }
  }
}
```

#### 3. 리팩토링
코드 품질 개선:

```typescript
export class UserAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async login(credentials: Credentials): Promise<AuthResult> {
    const user = await this.findAndValidateUser(credentials)
    const token = await this.tokenService.generate(user)
    
    return { token, user: this.sanitizeUser(user) }
  }

  private async findAndValidateUser(credentials: Credentials): Promise<User> {
    const user = await this.userRepository.findByEmail(credentials.email)
    
    if (!user) {
      throw new AuthenticationError('Invalid credentials')
    }

    const isValid = await this.passwordService.verify(
      credentials.password,
      user.password
    )

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials')
    }

    return user
  }

  private sanitizeUser(user: User): SafeUser {
    const { password, ...safeUser } = user
    return safeUser
  }
}
```

## 3. Test Runner Agent

### 역할
테스트를 실행하고 결과를 수집합니다.

### 실행 모드

#### Single Run
```bash
pnpm tdd:run
```

#### Watch Mode
```bash
pnpm tdd:watch
```

#### Coverage Mode
```bash
pnpm tdd:coverage
```

### 결과 포맷

```json
{
  "timestamp": "2025-10-29T10:00:00Z",
  "total": 50,
  "passed": 48,
  "failed": 2,
  "duration": 1234,
  "coverage": {
    "lines": 85.5,
    "statements": 84.2,
    "functions": 90.0,
    "branches": 75.3
  }
}
```

## 4. Orchestrator Agent

### 역할
모든 에이전트를 조율하여 완전한 TDD 사이클을 실행합니다.

### 워크플로우

```typescript
class OrchestratorAgent {
  async runTDDCycle() {
    // 1. Red: 테스트 실행
    const testResult = await this.testRunner.run()
    
    if (testResult.allPassed) {
      return this.onSuccess()
    }

    // 2. Analyze: 실패 분석
    const analysis = await this.analyzer.analyze(testResult)

    // 3. Green: 구현 생성
    const implementation = await this.implGenerator.generate(analysis)

    // 4. 재테스트
    const retestResult = await this.testRunner.run()

    // 5. 리포트
    return await this.reporter.generate({
      initial: testResult,
      analysis,
      implementation,
      final: retestResult
    })
  }
}
```

## 에이전트 간 통신

### 메시지 포맷

```typescript
interface AgentMessage {
  from: AgentType
  to: AgentType
  type: MessageType
  payload: unknown
  timestamp: string
}

type AgentType = 'test-writer' | 'impl-generator' | 'test-runner' | 'orchestrator'
type MessageType = 'request' | 'response' | 'event' | 'error'
```

### 이벤트 흐름

```
User Request
    │
    ▼
Orchestrator ──► Test Writer ──► Test Runner
    │                               │
    │                               ▼
    │◄────────── Analyzer ◄─────── Result
    │
    ▼
Impl Generator ──► File System
    │
    ▼
Test Runner ──► Reporter
    │
    ▼
User Feedback
```

## 설정

### 에이전트 설정 파일

```typescript
// infra/config/tdd.config.ts
export const agentConfig = {
  testWriter: {
    template: 'jest',
    pattern: 'given-when-then',
    includeEdgeCases: true
  },
  implGenerator: {
    style: 'minimal-first',
    autoRefactor: true
  },
  testRunner: {
    framework: 'vitest',
    parallel: true,
    timeout: 5000
  }
}
```

## 모니터링

### 로그 레벨

```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

### 메트릭

- 테스트 실행 시간
- 성공률
- 커버리지
- 에이전트 응답 시간

---

다음: [테스트 라이프사이클](./02-test-lifecycle.md)

