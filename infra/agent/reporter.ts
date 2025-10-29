/**
 * Reporter
 * 
 * TDD 사이클 결과를 리포트로 생성합니다.
 */

import fs from 'fs/promises'
import path from 'path'
import type { AgentContext } from './index'
import type { TestResult } from './testRunner'
import type { AnalysisResult } from './analyzer'
import type { FixResult } from './fixer'
import { getFolderManager } from './utils'

export interface ReportData {
  initialTest: TestResult
  analysis: AnalysisResult
  fix: FixResult
  finalTest: TestResult
}

export interface Report {
  timestamp: string
  role: string
  summary: ReportSummary
  details: ReportDetails
  filePath: string
}

export interface ReportSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  fixAttempts: number
  successfulFixes: number
  duration: number
  status: 'success' | 'partial' | 'failed'
}

export interface ReportDetails {
  initialTestResult: TestResult
  analysisResult: AnalysisResult
  fixResult: FixResult
  finalTestResult: TestResult
  improvements: string[]
  remainingIssues: string[]
}

/**
 * 리포트 생성 담당 클래스
 */
export class Reporter {
  private context: AgentContext

  constructor(context: AgentContext) {
    this.context = context
  }

  /**
   * 리포트 생성
   */
  async generate(data: ReportData): Promise<Report> {
    console.log('📊 리포트 생성 중...')

    const timestamp = new Date().toISOString()
    const role = 'tdd-agent' // 역할별로 분리 가능

    // 요약 생성
    const summary = this.generateSummary(data)

    // 상세 내용 생성
    const details = this.generateDetails(data)

    // 파일 저장
    const filePath = await this.saveReport(role, timestamp, summary, details)

    // 최신 리포트 링크 업데이트
    await this.updateLatestReport(role, filePath)

    // 세션 요약 업데이트
    await this.updateSessionSummary(summary)

    console.log(`✅ 리포트 생성 완료: ${filePath}`)

    return {
      timestamp,
      role,
      summary,
      details,
      filePath
    }
  }

  /**
   * 요약 생성
   */
  private generateSummary(data: ReportData): ReportSummary {
    const { initialTest, fix, finalTest } = data

    const totalTests = finalTest.total
    const passedTests = finalTest.passed
    const failedTests = finalTest.failed
    const fixAttempts = fix.fixes.length
    const successfulFixes = fix.fixes.filter(f => f.applied).length
    const duration = initialTest.duration + finalTest.duration

    let status: 'success' | 'partial' | 'failed' = 'failed'
    if (finalTest.allPassed) {
      status = 'success'
    } else if (successfulFixes > 0) {
      status = 'partial'
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      fixAttempts,
      successfulFixes,
      duration,
      status
    }
  }

  /**
   * 상세 내용 생성
   */
  private generateDetails(data: ReportData): ReportDetails {
    const improvements: string[] = []
    const remainingIssues: string[] = []

    // 개선된 테스트 찾기
    const initialFailed = data.initialTest.failed
    const finalFailed = data.finalTest.failed
    const fixedCount = initialFailed - finalFailed

    if (fixedCount > 0) {
      improvements.push(`${fixedCount}개의 테스트가 통과했습니다.`)
    }

    // 남은 이슈 정리
    for (const failure of data.finalTest.failures) {
      remainingIssues.push(`${failure.testFile}: ${failure.testName}`)
    }

    return {
      initialTestResult: data.initialTest,
      analysisResult: data.analysis,
      fixResult: data.fix,
      finalTestResult: data.finalTest,
      improvements,
      remainingIssues
    }
  }

  /**
   * 리포트 저장
   */
  private async saveReport(
    role: string,
    timestamp: string,
    summary: ReportSummary,
    details: ReportDetails
  ): Promise<string> {
    // FolderManager를 사용하여 리포트 폴더 생성
    const folderManager = getFolderManager(this.context.workingDir)
    const reportDir = await folderManager.createReportFolder(role, timestamp)

    // result.json 저장
    const resultPath = path.join(reportDir, 'result.json')
    await fs.writeFile(
      resultPath,
      JSON.stringify({ summary, details }, null, 2)
    )

    // summary.md 저장
    const summaryPath = path.join(reportDir, 'summary.md')
    await fs.writeFile(summaryPath, this.generateSummaryMarkdown(summary, details))

    // evaluation.md 저장
    const evaluationPath = path.join(reportDir, 'evaluation.md')
    await fs.writeFile(evaluationPath, this.generateEvaluationMarkdown(summary, details))

    return summaryPath
  }

  /**
   * Summary Markdown 생성
   */
  private generateSummaryMarkdown(summary: ReportSummary, details: ReportDetails): string {
    const statusEmoji = {
      success: '✅',
      partial: '⚠️',
      failed: '❌'
    }

    return `# TDD 사이클 요약

${statusEmoji[summary.status]} **상태**: ${summary.status.toUpperCase()}

## 테스트 결과
- 전체: ${summary.totalTests}개
- 통과: ${summary.passedTests}개
- 실패: ${summary.failedTests}개
- 소요 시간: ${summary.duration}ms

## 수정 시도
- 시도: ${summary.fixAttempts}개
- 성공: ${summary.successfulFixes}개

## 개선 사항
${details.improvements.length > 0 
  ? details.improvements.map(i => `- ${i}`).join('\n')
  : '- 없음'}

## 남은 이슈
${details.remainingIssues.length > 0
  ? details.remainingIssues.map(i => `- ${i}`).join('\n')
  : '- 없음'}

---
생성 시간: ${new Date().toLocaleString('ko-KR')}
`
  }

  /**
   * Evaluation Markdown 생성
   */
  private generateEvaluationMarkdown(summary: ReportSummary, details: ReportDetails): string {
    const successRate = summary.totalTests > 0 
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1)
      : '0'

    const fixSuccessRate = summary.fixAttempts > 0
      ? ((summary.successfulFixes / summary.fixAttempts) * 100).toFixed(1)
      : '0'

    return `# TDD 사이클 평가

## 성과 지표
- 테스트 통과율: ${successRate}%
- 수정 성공률: ${fixSuccessRate}%
- 평균 테스트 시간: ${summary.duration / Math.max(summary.totalTests, 1)}ms/test

## 품질 평가
${this.evaluateQuality(summary)}

## 권장사항
${this.generateRecommendations(summary, details)}

## 다음 단계
${this.generateNextSteps(summary, details)}

---
생성 시간: ${new Date().toLocaleString('ko-KR')}
`
  }

  /**
   * 품질 평가
   */
  private evaluateQuality(summary: ReportSummary): string {
    const { totalTests, passedTests, status } = summary
    const rate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

    if (rate === 100) {
      return '🌟 **우수**: 모든 테스트가 통과했습니다!'
    } else if (rate >= 80) {
      return '👍 **양호**: 대부분의 테스트가 통과했습니다.'
    } else if (rate >= 60) {
      return '⚠️  **개선 필요**: 일부 테스트가 실패했습니다.'
    } else {
      return '❌ **불량**: 많은 테스트가 실패했습니다.'
    }
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(summary: ReportSummary, details: ReportDetails): string {
    const recommendations: string[] = []

    if (summary.failedTests > 0) {
      recommendations.push('실패한 테스트를 우선 수정하세요.')
    }

    if (summary.fixAttempts > summary.successfulFixes) {
      recommendations.push('수정 실패 케이스를 분석하여 근본 원인을 파악하세요.')
    }

    if (details.remainingIssues.length > 3) {
      recommendations.push('이슈가 많으므로 우선순위를 정하여 단계적으로 해결하세요.')
    }

    if (recommendations.length === 0) {
      recommendations.push('계속 좋은 코드를 작성하세요!')
    }

    return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
  }

  /**
   * 다음 단계 생성
   */
  private generateNextSteps(summary: ReportSummary, details: ReportDetails): string {
    const steps: string[] = []

    if (summary.status === 'success') {
      steps.push('✅ 리팩토링을 진행하세요.')
      steps.push('✅ 커밋하고 다음 기능으로 넘어가세요.')
    } else if (summary.status === 'partial') {
      steps.push('1. 남은 실패 테스트를 분석하세요.')
      steps.push('2. 수정 사항을 적용하세요.')
      steps.push('3. 테스트를 다시 실행하세요.')
    } else {
      steps.push('1. 실패 원인을 상세히 분석하세요.')
      steps.push('2. 가장 심각한 이슈부터 해결하세요.')
      steps.push('3. 단계별로 테스트하세요.')
    }

    return steps.join('\n')
  }

  /**
   * 최신 리포트 링크 업데이트
   */
  private async updateLatestReport(role: string, reportPath: string): Promise<void> {
    const latestPath = path.join(
      this.context.workingDir,
      'infra',
      'reports',
      role,
      'latest.md'
    )

    const content = `# 최신 TDD 리포트

최신 리포트: [${path.basename(path.dirname(reportPath))}](${path.relative(path.dirname(latestPath), reportPath)})

업데이트 시간: ${new Date().toLocaleString('ko-KR')}
`

    await fs.writeFile(latestPath, content)
  }

  /**
   * 세션 요약 업데이트
   */
  private async updateSessionSummary(summary: ReportSummary): Promise<void> {
    const summaryPath = path.join(
      this.context.workingDir,
      'infra',
      'overview',
      'tdd-session-summary.md'
    )

    // 디렉토리 생성
    await fs.mkdir(path.dirname(summaryPath), { recursive: true })

    let content = ''
    
    // 기존 내용 읽기
    try {
      content = await fs.readFile(summaryPath, 'utf-8')
    } catch {
      content = '# TDD 세션 요약\n\n'
    }

    // 새 세션 추가
    content += `\n## ${new Date().toLocaleString('ko-KR')}\n`
    content += `- 상태: ${summary.status}\n`
    content += `- 테스트: ${summary.passedTests}/${summary.totalTests} 통과\n`
    content += `- 수정: ${summary.successfulFixes}/${summary.fixAttempts} 성공\n`
    content += `- 소요 시간: ${summary.duration}ms\n`

    await fs.writeFile(summaryPath, content)
  }
}

