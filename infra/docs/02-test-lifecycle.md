# 테스트 라이프사이클

## TDD 사이클 상세 가이드

이 문서는 TDD 자동화 시스템에서의 완전한 테스트 라이프사이클을 설명합니다.

## 전체 흐름

```
┌──────────────┐
│   요구사항    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 1. RED 단계  │  테스트 작성 및 실패 확인
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. 실패 분석  │  원인 파악 및 우선순위 결정
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. GREEN 단계│  최소 구현으로 테스트 통과
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. REFACTOR  │  코드 품질 개선
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   커밋       │
└──────────────┘
```

## 1. RED 단계 (테스트 작성)

### 1.1 요구사항 분석

```typescript
// 요구사항: 사용자는 이메일과 비밀번호로 로그인할 수 있다.

// 분석:
// - 입력: email (string), password (string)
// - 출력: { token: string, user: User }
// - 예외: 잘못된 인증 정보
```

### 1.2 테스트 시나리오 작성

```typescript
describe('UserAuthService.login', () => {
  // 정상 케이스
  it('should return token when credentials are valid', async () => {
    // 구현
  })

  // 에러 케이스
  it('should throw error when email is invalid', async () => {
    // 구현
  })

  it('should throw error when password is wrong', async () => {
    // 구현
  })

  // Edge 케이스
  it('should handle empty credentials', async () => {
    // 구현
  })

  it('should handle SQL injection attempts', async () => {
    // 구현
  })
})
```

### 1.3 테스트 실행 및 실패 확인

```bash
$ pnpm test

FAIL  src/services/auth.test.ts
  UserAuthService.login
    ✗ should return token when credentials are valid (5ms)
    ✗ should throw error when email is invalid (2ms)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
```

### 1.4 실패 원인 확인

```
Error: Cannot find module './auth.service'
```

→ 예상된 실패: 구현이 아직 없음

## 2. 실패 분석 단계

### 2.1 자동 분석

```typescript
// Analyzer가 자동으로 실행
const analysis = await analyzer.analyze(testResult)

// 결과:
{
  failures: [
    {
      category: 'missing-implementation',
      severity: 'high',
      possibleCauses: ['AuthService가 구현되지 않음'],
      recommendation: 'AuthService 클래스 생성'
    }
  ]
}
```

### 2.2 우선순위 결정

1. **Critical**: 문법 오류, 타입 오류
2. **High**: 미구현 함수/클래스
3. **Medium**: 로직 오류
4. **Low**: 성능 이슈

### 2.3 수정 계획 수립

```
계획:
1. AuthService 클래스 생성
2. login 메서드 스텁 구현
3. 테스트 재실행
4. 각 테스트를 순차적으로 통과시키기
```

## 3. GREEN 단계 (구현)

### 3.1 최소 구현 (1차)

```typescript
// src/services/auth.service.ts
export class AuthService {
  async login(credentials: Credentials): Promise<AuthResult> {
    // 일단 테스트만 통과시키기
    return {
      token: 'fake-token',
      user: { id: '1', email: credentials.email }
    }
  }
}
```

```bash
$ pnpm test

PASS  src/services/auth.test.ts
  UserAuthService.login
    ✓ should return token when credentials are valid (12ms)
    ✗ should throw error when email is invalid (5ms)
```

### 3.2 점진적 구현 (2차)

```typescript
export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(credentials: Credentials): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(credentials.email)
    
    if (!user) {
      throw new Error('Invalid credentials')
    }

    return {
      token: await this.generateToken(user),
      user
    }
  }

  private async generateToken(user: User): Promise<string> {
    // JWT 생성 로직
    return jwt.sign({ userId: user.id }, SECRET)
  }
}
```

```bash
$ pnpm test

PASS  src/services/auth.test.ts
  UserAuthService.login
    ✓ should return token when credentials are valid (12ms)
    ✓ should throw error when email is invalid (8ms)
    ✗ should throw error when password is wrong (5ms)
```

### 3.3 완전한 구현 (3차)

```typescript
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService
  ) {}

  async login(credentials: Credentials): Promise<AuthResult> {
    this.validateCredentials(credentials)

    const user = await this.findUser(credentials.email)
    await this.verifyPassword(credentials.password, user.password)

    const token = await this.tokenService.generate(user)

    return { token, user: this.sanitizeUser(user) }
  }

  private validateCredentials(credentials: Credentials): void {
    if (!credentials.email || !credentials.password) {
      throw new ValidationError('Email and password are required')
    }
  }

  private async findUser(email: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email)
    
    if (!user) {
      throw new AuthenticationError('Invalid credentials')
    }

    return user
  }

  private async verifyPassword(input: string, hashed: string): Promise<void> {
    const isValid = await this.passwordService.verify(input, hashed)
    
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials')
    }
  }

  private sanitizeUser(user: User): SafeUser {
    const { password, ...safeUser } = user
    return safeUser
  }
}
```

```bash
$ pnpm test

PASS  src/services/auth.test.ts
  UserAuthService.login
    ✓ should return token when credentials are valid (12ms)
    ✓ should throw error when email is invalid (8ms)
    ✓ should throw error when password is wrong (9ms)
    ✓ should handle empty credentials (5ms)
    ✓ should handle SQL injection attempts (7ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

## 4. REFACTOR 단계 (리팩토링)

### 4.1 코드 품질 검토

체크리스트:
- [ ] 중복 코드 제거
- [ ] 의미있는 변수명
- [ ] 함수 길이 적절
- [ ] 단일 책임 원칙 준수
- [ ] 의존성 주입 적용

### 4.2 리팩토링 적용

Before:
```typescript
async login(credentials: Credentials): Promise<AuthResult> {
  // 긴 메서드
  const user = await this.userRepo.findByEmail(credentials.email)
  if (!user) throw new Error('Invalid')
  const valid = await bcrypt.compare(credentials.password, user.password)
  if (!valid) throw new Error('Invalid')
  const token = jwt.sign({ id: user.id }, process.env.SECRET)
  return { token, user }
}
```

After:
```typescript
async login(credentials: Credentials): Promise<AuthResult> {
  const user = await this.authenticateUser(credentials)
  const token = await this.tokenService.generate(user)
  return { token, user: this.sanitizeUser(user) }
}

private async authenticateUser(credentials: Credentials): Promise<User> {
  const user = await this.findUser(credentials.email)
  await this.verifyPassword(credentials.password, user.password)
  return user
}
```

### 4.3 테스트 재실행

```bash
$ pnpm test

PASS  src/services/auth.test.ts
  UserAuthService.login
    ✓ should return token when credentials are valid (12ms)
    ✓ should throw error when email is invalid (8ms)
    ✓ should throw error when password is wrong (9ms)
    ✓ should handle empty credentials (5ms)
    ✓ should handle SQL injection attempts (7ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Coverage:    95.2%
```

## 5. 커밋

### 5.1 변경사항 검토

```bash
$ git status

Modified files:
- src/services/auth.service.ts (new)
- src/services/auth.test.ts (new)
- src/types/auth.ts (new)
```

### 5.2 커밋 메시지 작성

```bash
$ git add src/services/auth.*
$ git commit -m "feat(auth): implement user login functionality

- Add AuthService with login method
- Implement credential validation
- Add password verification
- Generate JWT tokens
- Add comprehensive test coverage (95.2%)

Closes #123"
```

## 자동화 워크플로우

### Watch 모드

```typescript
// 파일 변경 감지 시 자동 실행
watch('src/**/*.ts', async (event, filename) => {
  console.log(`${filename} changed, running tests...`)
  
  const result = await runTests()
  
  if (!result.allPassed) {
    const analysis = await analyze(result)
    const suggestions = await generateSuggestions(analysis)
    
    console.log('Suggestions:', suggestions)
  }
})
```

### 연속 사이클

```typescript
async function continuousTDD() {
  let iteration = 1
  
  while (true) {
    console.log(`\n=== Iteration ${iteration} ===`)
    
    // 1. Test
    const result = await runTests()
    
    if (result.allPassed) {
      console.log('✅ All tests passed!')
      break
    }

    // 2. Analyze
    const analysis = await analyze(result)

    // 3. Fix
    const fixes = await generateFixes(analysis)
    await applyFixes(fixes)

    // 4. Report
    await generateReport({ iteration, result, analysis, fixes })

    iteration++
  }
}
```

## 베스트 프랙티스

### DO ✅

1. **작은 단계로 진행**
   - 한 번에 하나의 테스트만 통과시키기
   - 점진적으로 기능 추가

2. **의미있는 테스트 작성**
   - 비즈니스 요구사항 반영
   - 실제 사용 시나리오 테스트

3. **빠른 피드백**
   - 테스트는 빠르게 실행되어야 함
   - Watch 모드 활용

4. **리팩토링 주기적으로**
   - Green 단계 후 항상 리팩토링
   - 테스트가 보호망 역할

### DON'T ❌

1. **테스트 건너뛰기**
   - 구현부터 하지 않기
   - TDD 순서 지키기

2. **과도한 구현**
   - 필요 이상의 코드 작성하지 않기
   - YAGNI 원칙 준수

3. **테스트 무시**
   - 실패한 테스트 방치하지 않기
   - 모든 테스트 통과 유지

---

다음: [자동 생성 문서](./03-auto-generated.md)

