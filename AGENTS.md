# TDD 자동화 에이전트 시스템

TypeScript 기반의 Node.js 애플리케이션을 위한 Test-Driven Development(TDD) 자동화 시스템입니다.

## 🎯 목적

- **자동화된 TDD 사이클**: Red-Green-Refactor 사이클을 자동으로 실행
- **지능형 분석**: 테스트 실패 원인을 자동으로 분석하고 수정 방향 제시
- **빠른 피드백**: 실시간 테스트 결과 및 리포트 제공
- **품질 향상**: 체계적인 TDD를 통한 코드 품질 개선

## 🚀 빠른 시작

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 설정
cp infra/config/env.sample .env
```

### 실행

```bash
# 한 번 실행
pnpm tdd:run

# Watch 모드 (파일 변경 감지)
pnpm tdd:watch

# Dry-run (실제 파일 수정 없이 미리보기)
pnpm tdd:run --dry-run
```

## 📁 프로젝트 구조

```
.
├── .agent/                 # 에이전트 역할 정의
│   ├── roles/             # 역할별 마크다운 문서
│   │   ├── test-writer.md
│   │   ├── impl-writer.md
│   │   ├── runner.md
│   │   └── committer.md
│   ├── workflows/         # 워크플로우 정의
│   └── templates/         # 코드 템플릿
│
├── agents/                # 에이전트 구현체
│   ├── test-writer/       # 테스트 작성 에이전트
│   ├── test-runner/       # 테스트 실행 에이전트
│   ├── impl-generator/    # 구현 생성 에이전트
│   └── orchestrator/      # 오케스트레이터 에이전트
│
├── infra/                 # 인프라 코드
│   ├── agent/            # 핵심 로직
│   │   ├── index.ts      # 메인 엔트리
│   │   ├── testRunner.ts # 테스트 실행
│   │   ├── analyzer.ts   # 결과 분석
│   │   ├── fixer.ts      # 코드 수정
│   │   ├── reporter.ts   # 리포트 생성
│   │   └── utils/        # 유틸리티
│   │
│   ├── docs/             # 문서
│   │   ├── 00-intro.md
│   │   ├── 01-agent-guide.md
│   │   ├── 02-test-lifecycle.md
│   │   └── 03-auto-generated.md
│   │
│   ├── config/           # 설정
│   │   ├── tdd.config.ts
│   │   └── env.sample
│   │
│   ├── scripts/          # 실행 스크립트
│   │   ├── run-tdd.ts
│   │   └── watch-tests.ts
│   │
│   ├── reports/          # 테스트 리포트 (동적 생성)
│   │   └── {role}/
│   │       └── {timestamp}/
│   │           ├── result.json
│   │           ├── summary.md
│   │           └── evaluation.md
│   │
│   ├── overview/         # 전체 요약 (동적 생성)
│   │   └── tdd-session-summary.md
│   │
│   └── tmp/              # 임시 파일
│       ├── cache.json
│       └── backups/
│
├── src/                  # 소스 코드
├── docs/                 # 프로젝트 문서
│   └── TDD-AGENT-OPERATIONS.md
└── package.json
```

## 🤖 에이전트 시스템

### 1. Test Writer Agent
**역할**: 테스트 케이스 작성

- 요구사항 분석
- Given-When-Then 패턴으로 테스트 작성
- Edge case 및 에러 케이스 포함

### 2. Implementation Generator Agent
**역할**: 구현 코드 생성

- 테스트를 통과시키는 최소 구현
- 타입 안정성 보장
- 점진적 기능 추가

### 3. Test Runner Agent
**역할**: 테스트 실행 및 결과 수집

- 자동 테스트 실행
- 커버리지 측정
- 실패 케이스 추출

### 4. Orchestrator Agent
**역할**: 전체 TDD 사이클 조율

- Red-Green-Refactor 사이클 관리
- 에이전트 간 통신 조율
- 워크플로우 실행

## 🔄 TDD 사이클

```
┌──────────────┐
│   요구사항    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  RED 단계    │  테스트 작성 → 실패 확인
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  분석 단계    │  실패 원인 분석 → 수정 방향 제시
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ GREEN 단계   │  최소 구현 → 테스트 통과
└──────┬───────┘
       │
       ▼
┌──────────────┐
│REFACTOR 단계 │  코드 개선 → 품질 향상
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   커밋       │  변경사항 저장
└──────────────┘
```

## 📊 리포트 시스템

### 자동 생성 리포트

테스트 실행 시마다 다음 리포트가 자동으로 생성됩니다:

1. **result.json**: 구조화된 테스트 결과
2. **summary.md**: 테스트 요약
3. **evaluation.md**: 품질 평가 및 권장사항

### 리포트 위치

```
infra/
├── reports/
│   └── {role}/
│       ├── {timestamp}/     # 각 실행별 리포트
│       └── latest.md        # 최신 리포트 링크
└── overview/
    └── tdd-session-summary.md  # 전체 세션 요약
```

## ⚙️ 설정

### 기본 설정

`infra/config/tdd.config.ts` 파일에서 기본 설정을 확인할 수 있습니다.

### 환경 변수

`.env` 파일을 생성하여 설정을 커스터마이징할 수 있습니다:

```bash
# 테스트 명령어
TDD_TEST_COMMAND=npm test

# 커버리지 임계값
TDD_COVERAGE_LINES=80
TDD_COVERAGE_STATEMENTS=80

# Watch 모드
TDD_WATCH_MODE=false

# 리포트 보관 기간
TDD_REPORT_RETENTION_DAYS=30
```

## 📖 문서

### 핵심 가이드

- [00-intro.md](./infra/docs/00-intro.md): 시스템 소개
- [01-agent-guide.md](./infra/docs/01-agent-guide.md): 에이전트 사용법
- [02-test-lifecycle.md](./infra/docs/02-test-lifecycle.md): 테스트 라이프사이클
- [03-auto-generated.md](./infra/docs/03-auto-generated.md): 자동 생성 문서

### 운영 가이드

- [TDD-AGENT-OPERATIONS.md](./docs/TDD-AGENT-OPERATIONS.md): 운영 매뉴얼

## 🛠️ 개발

### 요구사항

- Node.js >= 18
- pnpm >= 8

### 개발 모드

```bash
# 개발 모드로 실행
pnpm dev

# 타입 체크
pnpm typecheck

# 린트
pnpm lint
```

## 📝 package.json 스크립트

프로젝트의 `package.json`에 다음 스크립트를 추가하세요:

```json
{
  "scripts": {
    "tdd:run": "tsx infra/scripts/run-tdd.ts",
    "tdd:watch": "tsx infra/scripts/watch-tests.ts",
    "tdd:clean": "rm -rf infra/reports/* infra/tmp/*"
  }
}
```

## 🔧 커스터마이징

### 커스텀 에이전트 추가

```typescript
// agents/custom-agent/index.ts
export class CustomAgent {
  async execute() {
    // 커스텀 로직
  }
}
```

### 커스텀 리포터

```typescript
// infra/agent/custom-reporter.ts
import { Reporter } from './reporter'

export class CustomReporter extends Reporter {
  protected generateSummaryMarkdown(summary, details) {
    // 커스텀 포맷
    return `# My Custom Report\n${summary}`
  }
}
```

## 🤝 기여

이 프로젝트는 템플릿으로 제공됩니다. 자유롭게 수정하여 사용하세요.

## 📄 라이센스

MIT License

## 🙋 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**버전**: 1.0.0  
**최종 업데이트**: ${new Date().toISOString()}

