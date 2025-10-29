# 자동 생성 문서

## 개요

TDD 자동화 시스템은 테스트 실행 시마다 다양한 문서와 리포트를 자동으로 생성합니다.

## 생성되는 문서 유형

### 1. 테스트 결과 리포트

#### 위치
```
infra/reports/{role}/{timestamp}/
├── result.json
├── summary.md
└── evaluation.md
```

#### result.json
```json
{
  "summary": {
    "totalTests": 50,
    "passedTests": 48,
    "failedTests": 2,
    "fixAttempts": 5,
    "successfulFixes": 4,
    "duration": 1234,
    "status": "partial"
  },
  "details": {
    "initialTestResult": { ... },
    "analysisResult": { ... },
    "fixResult": { ... },
    "finalTestResult": { ... },
    "improvements": [
      "4개의 테스트가 통과했습니다."
    ],
    "remainingIssues": [
      "auth.test.ts: should handle rate limiting",
      "auth.test.ts: should log failed attempts"
    ]
  }
}
```

#### summary.md
```markdown
# TDD 사이클 요약

✅ **상태**: SUCCESS

## 테스트 결과
- 전체: 50개
- 통과: 48개
- 실패: 2개
- 소요 시간: 1234ms

## 수정 시도
- 시도: 5개
- 성공: 4개

## 개선 사항
- 4개의 테스트가 통과했습니다.

## 남은 이슈
- auth.test.ts: should handle rate limiting
- auth.test.ts: should log failed attempts
```

#### evaluation.md
```markdown
# TDD 사이클 평가

## 성과 지표
- 테스트 통과율: 96.0%
- 수정 성공률: 80.0%
- 평균 테스트 시간: 24.68ms/test

## 품질 평가
👍 **양호**: 대부분의 테스트가 통과했습니다.

## 권장사항
1. 실패한 테스트를 우선 수정하세요.

## 다음 단계
1. 남은 실패 테스트를 분석하세요.
2. 수정 사항을 적용하세요.
3. 테스트를 다시 실행하세요.
```

### 2. 최신 리포트 링크

#### 위치
```
infra/reports/{role}/latest.md
```

#### 내용
```markdown
# 최신 TDD 리포트

최신 리포트: [2025-10-29_10-30-00](./2025-10-29_10-30-00/summary.md)

업데이트 시간: 2025-10-29 10:30:00
```

### 3. 세션 요약

#### 위치
```
infra/overview/tdd-session-summary.md
```

#### 내용
```markdown
# TDD 세션 요약

## 2025-10-29 10:00:00
- 상태: success
- 테스트: 45/50 통과
- 수정: 3/5 성공
- 소요 시간: 987ms

## 2025-10-29 10:15:00
- 상태: partial
- 테스트: 48/50 통과
- 수정: 4/5 성공
- 소요 시간: 1234ms

## 2025-10-29 10:30:00
- 상태: success
- 테스트: 50/50 통과
- 수정: 5/5 성공
- 소요 시간: 1100ms
```

## 동적 폴더 생성

### 실행 시점
- 테스트 실행 시마다 새 폴더 생성
- 타임스탬프 기반으로 폴더명 결정

### 폴더 구조
```
infra/
└── reports/
    ├── test-writer/
    │   ├── 2025-10-29_10-00-00/
    │   │   ├── result.json
    │   │   ├── summary.md
    │   │   └── evaluation.md
    │   ├── 2025-10-29_10-15-00/
    │   │   ├── result.json
    │   │   ├── summary.md
    │   │   └── evaluation.md
    │   └── latest.md
    ├── impl-generator/
    │   └── ...
    └── test-runner/
        └── ...
```

## 리포트 활용

### 1. 진행 상황 추적

```typescript
// 특정 세션의 리포트 읽기
const report = await readReport('test-runner', '2025-10-29_10-00-00')

console.log(`통과율: ${report.summary.passedTests / report.summary.totalTests * 100}%`)
```

### 2. 트렌드 분석

```typescript
// 최근 10개 세션의 통과율 추이
const sessions = await getRecentSessions(10)

const trend = sessions.map(s => ({
  time: s.timestamp,
  passRate: (s.summary.passedTests / s.summary.totalTests) * 100
}))

console.log('통과율 추이:', trend)
```

### 3. 대시보드

```typescript
// 전체 통계 생성
const stats = {
  totalSessions: await countSessions(),
  averagePassRate: await calculateAveragePassRate(),
  totalTests: await countTotalTests(),
  commonFailures: await getCommonFailures()
}
```

## 커스터마이징

### 리포트 템플릿 수정

```typescript
// infra/agent/reporter.ts
class Reporter {
  private generateSummaryMarkdown(
    summary: ReportSummary,
    details: ReportDetails
  ): string {
    // 커스텀 템플릿
    return `
# My Custom Report

## Results
Total: ${summary.totalTests}
Passed: ${summary.passedTests}
Failed: ${summary.failedTests}

## Custom Section
${this.myCustomSection(details)}
`
  }
}
```

### 추가 메트릭 수집

```typescript
interface CustomMetrics {
  codeComplexity: number
  technicalDebt: number
  performanceScore: number
}

class ExtendedReporter extends Reporter {
  async generate(data: ReportData): Promise<Report> {
    const baseReport = await super.generate(data)
    
    // 추가 메트릭 수집
    const customMetrics = await this.collectCustomMetrics(data)
    
    return {
      ...baseReport,
      customMetrics
    }
  }
}
```

## 리포트 보존 정책

### 자동 정리

```typescript
// 30일 이상 된 리포트 자동 삭제
async function cleanupOldReports(days: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const reports = await findReportsOlderThan(cutoffDate)
  
  for (const report of reports) {
    await deleteReport(report.path)
  }

  console.log(`${reports.length}개의 오래된 리포트를 삭제했습니다.`)
}
```

### 아카이빙

```typescript
// 중요한 리포트는 아카이브
async function archiveImportantReports() {
  const importantReports = await findReports({
    status: 'success',
    passRate: 100,
    duration: '<1000ms'
  })

  for (const report of importantReports) {
    await moveToArchive(report)
  }
}
```

## CI/CD 통합

### GitHub Actions 예제

```yaml
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
      
      - name: Run TDD Cycle
        run: pnpm tdd:run
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: tdd-reports
          path: infra/reports/
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        run: |
          node scripts/post-pr-comment.js
```

### 리포트를 PR 코멘트로 게시

```typescript
// scripts/post-pr-comment.js
import { Octokit } from '@octokit/rest'
import fs from 'fs/promises'

async function postComment() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  
  const summary = await fs.readFile(
    'infra/reports/test-runner/latest.md',
    'utf-8'
  )

  await octokit.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: `## TDD Automation Report\n\n${summary}`
  })
}

postComment()
```

## 모니터링 및 알림

### Slack 알림

```typescript
async function sendSlackNotification(report: Report) {
  const webhook = process.env.SLACK_WEBHOOK_URL
  
  const color = report.summary.status === 'success' ? 'good' : 'danger'
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: 'TDD Automation Report',
        fields: [
          { title: 'Status', value: report.summary.status, short: true },
          { title: 'Pass Rate', value: `${(report.summary.passedTests / report.summary.totalTests * 100).toFixed(1)}%`, short: true },
          { title: 'Duration', value: `${report.summary.duration}ms`, short: true }
        ]
      }]
    })
  })
}
```

---

이전: [테스트 라이프사이클](./02-test-lifecycle.md)

