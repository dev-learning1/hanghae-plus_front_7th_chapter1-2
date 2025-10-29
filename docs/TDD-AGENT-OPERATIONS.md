# TDD 에이전트 운영 가이드

이 문서는 TDD 자동화 시스템의 운영 방법을 상세히 설명합니다.

## 목차

- [설치 및 초기 설정](#설치-및-초기-설정)
- [일상 운영](#일상-운영)
- [트러블슈팅](#트러블슈팅)
- [모니터링](#모니터링)
- [유지보수](#유지보수)
- [베스트 프랙티스](#베스트-프랙티스)

## 설치 및 초기 설정

### 1. 프로젝트 구조 확인

TDD 에이전트 시스템이 이미 설치되어 있는지 확인:

```bash
# 필수 디렉토리 확인
ls -la .agent/ agents/ infra/

# 설정 파일 확인
ls -la infra/config/
```

### 2. 의존성 설치

```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm
npm install

# 또는 yarn
yarn install
```

### 3. 환경 설정

```bash
# 샘플 환경 파일 복사
cp infra/config/env.sample .env

# 에디터로 열어서 설정 수정
vi .env
```

#### 필수 설정 항목

```bash
# 프로젝트명
TDD_PROJECT_NAME=MyProject

# 테스트 명령어 (사용하는 테스트 프레임워크에 맞게)
TDD_TEST_COMMAND=npm test          # Jest/Vitest 등
# TDD_TEST_COMMAND=pnpm test
# TDD_TEST_COMMAND=yarn test

# 테스트 프레임워크
TDD_TEST_FRAMEWORK=vitest          # jest, vitest, mocha 중 선택
```

### 4. 초기 실행 테스트

```bash
# Dry-run으로 테스트 (실제 파일 수정 없음)
pnpm tdd:run --dry-run

# 정상 실행
pnpm tdd:run
```

### 5. package.json 스크립트 추가

```json
{
  "scripts": {
    "tdd:run": "tsx infra/scripts/run-tdd.ts",
    "tdd:watch": "tsx infra/scripts/watch-tests.ts",
    "tdd:clean": "rm -rf infra/reports/* infra/tmp/*",
    "tdd:report": "cat infra/reports/tdd-agent/latest.md"
  }
}
```

## 일상 운영

### 기본 사용 패턴

#### 1. 개발 중 (Watch 모드)

```bash
# Watch 모드 시작
pnpm tdd:watch

# 파일을 수정하면 자동으로 테스트 실행
# Ctrl+C로 종료
```

**Watch 모드 단축키:**
- `r`: 모든 테스트 재실행
- `c`: 콘솔 클리어
- `q` 또는 `Ctrl+C`: 종료
- `?`: 도움말

#### 2. CI/CD 파이프라인

```bash
# 한 번만 실행 (CI 환경)
pnpm tdd:run

# 종료 코드로 성공/실패 판단
echo $?  # 0: 성공, 1: 실패
```

#### 3. 리포트 확인

```bash
# 최신 리포트 확인
cat infra/reports/tdd-agent/latest.md

# 또는
pnpm tdd:report

# 전체 세션 요약
cat infra/overview/tdd-session-summary.md
```

### 워크플로우 예시

#### 새 기능 개발

```bash
# 1. Watch 모드 시작
pnpm tdd:watch

# 2. 테스트 작성
vim src/__tests__/new-feature.test.ts

# 3. 자동으로 테스트 실행 및 실패 확인 (RED)

# 4. 구현 작성
vim src/new-feature.ts

# 5. 자동으로 테스트 재실행 및 통과 확인 (GREEN)

# 6. 리팩토링
vim src/new-feature.ts

# 7. 테스트가 계속 통과하는지 확인

# 8. 완료되면 커밋
git add .
git commit -m "feat: add new feature"
```

#### 버그 수정

```bash
# 1. 버그를 재현하는 테스트 작성
vim src/__tests__/bug-fix.test.ts

# 2. 테스트 실행 (RED)
pnpm tdd:run

# 3. 버그 수정
vim src/buggy-file.ts

# 4. 테스트 통과 확인 (GREEN)
pnpm tdd:run

# 5. 커밋
git add .
git commit -m "fix: resolve issue with X"
```

## 트러블슈팅

### 일반적인 문제

#### 1. 테스트가 실행되지 않음

**증상:**
```
❌ 사전 검증 실패:
  - package.json을 찾을 수 없습니다.
```

**해결:**
```bash
# 올바른 디렉토리에 있는지 확인
pwd

# package.json이 있는 프로젝트 루트로 이동
cd /path/to/project

# 다시 실행
pnpm tdd:run
```

#### 2. 설정 파일을 찾을 수 없음

**증상:**
```
Failed to load config from tdd.config.ts
```

**해결:**
```bash
# 설정 파일 존재 확인
ls -la infra/config/tdd.config.ts

# 없으면 다시 생성
# (이 파일은 프로젝트에 포함되어 있어야 함)
```

#### 3. 테스트 명령어 실패

**증상:**
```
Error: Command failed: npm test
```

**해결:**
```bash
# 1. 테스트가 수동으로 실행되는지 확인
npm test

# 2. .env에서 테스트 명령어 확인
cat .env | grep TDD_TEST_COMMAND

# 3. 올바른 명령어로 수정
echo "TDD_TEST_COMMAND=pnpm test" >> .env
```

#### 4. 권한 문제

**증상:**
```
EACCES: permission denied
```

**해결:**
```bash
# 스크립트에 실행 권한 부여
chmod +x infra/scripts/*.ts

# 디렉토리 권한 확인
ls -la infra/
```

#### 5. 메모리 부족

**증상:**
```
JavaScript heap out of memory
```

**해결:**
```bash
# Node.js 메모리 제한 증가
export NODE_OPTIONS="--max-old-space-size=4096"

# 다시 실행
pnpm tdd:run
```

### 로그 확인

```bash
# 상세 로그로 실행
pnpm tdd:run --verbose

# 테스트 출력 확인
cat infra/reports/tdd-agent/*/result.json | jq .

# 에러 로그 필터링
cat infra/reports/tdd-agent/*/result.json | jq '.details.failures'
```

## 모니터링

### 성과 지표 추적

#### 1. 테스트 통과율

```bash
# 최근 10개 세션의 통과율
cat infra/overview/tdd-session-summary.md | tail -n 50
```

#### 2. 커버리지 추이

```bash
# 커버리지 포함 실행
pnpm test -- --coverage

# 커버리지 리포트 확인
cat coverage/coverage-summary.json
```

#### 3. 테스트 실행 시간

리포트에서 `duration` 필드 확인:

```bash
jq '.summary.duration' infra/reports/tdd-agent/*/result.json
```

### 대시보드 (선택사항)

#### 간단한 CLI 대시보드

```bash
# 스크립트 생성
cat > scripts/dashboard.sh << 'EOF'
#!/bin/bash
echo "=== TDD 통계 ==="
echo ""
echo "총 세션: $(ls infra/reports/tdd-agent/ | wc -l)"
echo ""
echo "최근 5개 세션:"
tail -n 25 infra/overview/tdd-session-summary.md
EOF

chmod +x scripts/dashboard.sh

# 실행
./scripts/dashboard.sh
```

## 유지보수

### 리포트 정리

#### 오래된 리포트 삭제

```bash
# 30일 이상 된 리포트 삭제
find infra/reports/ -type d -mtime +30 -exec rm -rf {} +

# 또는 전체 삭제
pnpm tdd:clean
```

#### 자동 정리 스크립트

```bash
# cron job 추가
crontab -e

# 매주 일요일 자정에 30일 이상 된 리포트 삭제
0 0 * * 0 find /path/to/project/infra/reports/ -type d -mtime +30 -exec rm -rf {} +
```

### 설정 업데이트

#### 설정 백업

```bash
# 현재 설정 백업
cp .env .env.backup
cp infra/config/tdd.config.ts infra/config/tdd.config.ts.backup
```

#### 설정 마이그레이션

새 버전으로 업그레이드할 때:

```bash
# 1. 현재 설정 백업
cp .env .env.backup

# 2. 새 샘플 파일 복사
cp infra/config/env.sample .env.new

# 3. 차이점 확인
diff .env.backup .env.new

# 4. 수동으로 병합
vi .env
```

### 캐시 관리

```bash
# 캐시 초기화
rm -f infra/tmp/cache.json

# 백업 정리
rm -rf infra/tmp/backups/*
```

## 베스트 프랙티스

### 1. 지속적 통합 (CI)

#### GitHub Actions 예시

```yaml
# .github/workflows/tdd.yml
name: TDD Automation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  tdd:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run TDD
        run: pnpm tdd:run
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: tdd-reports
          path: infra/reports/
```

### 2. 팀 워크플로우

#### Pull Request 체크리스트

```markdown
## TDD 체크리스트

- [ ] 새로운 기능에 대한 테스트 작성
- [ ] 모든 테스트 통과
- [ ] 커버리지 임계값 충족 (80% 이상)
- [ ] TDD 리포트 확인
- [ ] 코드 리뷰 완료
```

#### 코드 리뷰 시 확인사항

1. 테스트가 먼저 작성되었는가?
2. 테스트가 실패했다가 통과하는가?
3. 구현이 최소한인가?
4. 리팩토링이 적용되었는가?
5. 커버리지가 충분한가?

### 3. 성능 최적화

#### Watch 모드 최적화

```bash
# .env
TDD_WATCH_MODE=true
TDD_WATCH_PATTERNS=src/**/*.ts,src/**/*.tsx

# node_modules 등 제외
TDD_IGNORE_PATTERNS=**/node_modules/**,**/dist/**,**/build/**
```

#### 병렬 실행

```bash
# .env
TDD_RUNNER_PARALLEL=true
```

### 4. 알림 설정 (선택사항)

#### Slack 알림

```bash
# .env
TDD_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### 이메일 알림

```bash
# .env
TDD_EMAIL_ON_FAILURE=true
TDD_EMAIL_TO=team@example.com
```

## 추가 리소스

### 문서

- [시스템 소개](../infra/docs/00-intro.md)
- [에이전트 가이드](../infra/docs/01-agent-guide.md)
- [테스트 라이프사이클](../infra/docs/02-test-lifecycle.md)
- [자동 생성 문서](../infra/docs/03-auto-generated.md)

### 외부 참고자료

- [TDD 소개](https://en.wikipedia.org/wiki/Test-driven_development)
- [Jest 문서](https://jestjs.io/)
- [Vitest 문서](https://vitest.dev/)

## 지원

### 문제 보고

이슈가 있으면 다음 정보와 함께 보고해주세요:

1. 에러 메시지
2. 실행 환경 (OS, Node 버전)
3. 설정 파일 내용
4. 재현 방법

### 버전 정보 확인

```bash
# Node 버전
node --version

# pnpm 버전
pnpm --version

# 프로젝트 정보
cat package.json | jq '.version'
```

---

**최종 업데이트**: ${new Date().toISOString()}  
**문서 버전**: 1.0.0

