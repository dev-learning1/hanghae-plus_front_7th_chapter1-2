/**
 * Test Analyzer
 * 
 * 테스트 실패 원인을 분석하고 수정 방향을 제시합니다.
 */

import fs from 'fs/promises'
import path from 'path'
import type { AgentContext } from './index'
import type { TestResult, TestFailure } from './testRunner'

export interface AnalysisResult {
  timestamp: string
  failures: FailureAnalysis[]
  recommendations: Recommendation[]
  summary: string
}

export interface FailureAnalysis {
  failure: TestFailure
  category: FailureCategory
  possibleCauses: string[]
  affectedFiles: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export type FailureCategory = 
  | 'syntax-error'
  | 'type-error'
  | 'logic-error'
  | 'assertion-failure'
  | 'timeout'
  | 'missing-implementation'
  | 'integration-failure'
  | 'unknown'

export interface Recommendation {
  title: string
  description: string
  priority: number
  estimatedEffort: 'low' | 'medium' | 'high'
  suggestedAction: string
}

/**
 * 테스트 실패 분석 클래스
 */
export class Analyzer {
  private context: AgentContext

  constructor(context: AgentContext) {
    this.context = context
  }

  /**
   * 테스트 결과 분석
   */
  async analyze(testResult: TestResult): Promise<AnalysisResult> {
    console.log('🔍 테스트 실패 분석 시작...')
    console.log(`총 ${testResult.failures.length}개의 실패 케이스 분석 중...`)

    const failureAnalyses: FailureAnalysis[] = []
    
    for (const failure of testResult.failures) {
      const analysis = await this.analyzeFailure(failure)
      failureAnalyses.push(analysis)
    }

    const recommendations = this.generateRecommendations(failureAnalyses)
    const summary = this.generateSummary(failureAnalyses)

    console.log(`✅ 분석 완료: ${failureAnalyses.length}개 케이스`)

    return {
      timestamp: new Date().toISOString(),
      failures: failureAnalyses,
      recommendations,
      summary
    }
  }

  /**
   * 개별 실패 케이스 분석
   */
  private async analyzeFailure(failure: TestFailure): Promise<FailureAnalysis> {
    const category = this.categorizeFailure(failure)
    const possibleCauses = this.identifyPossibleCauses(failure, category)
    const affectedFiles = await this.identifyAffectedFiles(failure)
    const severity = this.calculateSeverity(failure, category)

    return {
      failure,
      category,
      possibleCauses,
      affectedFiles,
      severity
    }
  }

  /**
   * 실패 유형 분류
   */
  private categorizeFailure(failure: TestFailure): FailureCategory {
    const error = failure.error.toLowerCase()
    const testName = failure.testName.toLowerCase()

    // React/TypeScript 특화 오류 감지
    if (error.includes('syntaxerror') || error.includes('unexpected token')) {
      return 'syntax-error'
    }
    
    if (error.includes('typeerror') || error.includes('cannot read property') || 
        error.includes('undefined is not a function')) {
      return 'type-error'
    }
    
    // Vitest/Jest assertion 오류
    if (error.includes('expected') || error.includes('received') || 
        error.includes('toequal') || error.includes('tobe') ||
        error.includes('assertion')) {
      return 'assertion-failure'
    }
    
    // 타임아웃 관련
    if (error.includes('timeout') || error.includes('exceeded')) {
      return 'timeout'
    }
    
    // 미구현
    if (error.includes('not implemented') || error.includes('is not defined') ||
        error.includes('cannot find module') || error.includes('is not a function')) {
      return 'missing-implementation'
    }
    
    // React 특화 오류
    if (error.includes('cannot find') && (error.includes('element') || error.includes('role'))) {
      return 'assertion-failure' // React Testing Library 쿼리 실패
    }
    
    // MSW/네트워크 관련
    if (error.includes('network') || error.includes('connection') || 
        error.includes('fetch') || error.includes('api')) {
      return 'integration-failure'
    }

    return 'unknown'
  }

  /**
   * 가능한 원인 식별 (React/TypeScript 특화)
   */
  private identifyPossibleCauses(failure: TestFailure, category: FailureCategory): string[] {
    const causes: string[] = []
    const error = failure.error.toLowerCase()

    switch (category) {
      case 'syntax-error':
        causes.push('코드에 문법 오류가 있습니다.')
        causes.push('괄호나 중괄호가 맞지 않을 수 있습니다.')
        if (error.includes('jsx') || error.includes('tsx')) {
          causes.push('JSX 문법 오류가 있을 수 있습니다.')
        }
        break
      
      case 'type-error':
        causes.push('타입이 일치하지 않습니다.')
        causes.push('undefined 또는 null 값에 접근하고 있습니다.')
        if (error.includes('property')) {
          causes.push('존재하지 않는 속성에 접근하고 있습니다.')
        }
        if (error.includes('function')) {
          causes.push('함수가 아닌 값을 함수로 호출하고 있습니다.')
        }
        break
      
      case 'assertion-failure':
        causes.push('예상 값과 실제 값이 다릅니다.')
        causes.push('비즈니스 로직에 오류가 있을 수 있습니다.')
        
        // React Testing Library 특화 원인
        if (error.includes('unable to find') || error.includes('cannot find')) {
          causes.push('DOM에서 요소를 찾을 수 없습니다. selector를 확인하세요.')
          causes.push('컴포넌트가 올바르게 렌더링되지 않았을 수 있습니다.')
        }
        
        if (error.includes('toequal') || error.includes('tobe')) {
          causes.push('반환 값이 예상과 다릅니다.')
          causes.push('객체/배열 비교 시 toEqual을 사용해야 합니다.')
        }
        
        if (failure.testFile.includes('hook')) {
          causes.push('Hook의 반환 값이 예상과 다릅니다.')
          causes.push('상태 업데이트가 올바르게 되지 않았을 수 있습니다.')
        }
        break
      
      case 'missing-implementation':
        causes.push('함수나 메서드가 구현되지 않았습니다.')
        causes.push('모듈을 찾을 수 없습니다.')
        
        if (error.includes('cannot find module')) {
          causes.push('import 경로가 잘못되었을 수 있습니다.')
          causes.push('파일이 존재하지 않거나 export 되지 않았습니다.')
        }
        break
      
      case 'timeout':
        causes.push('비동기 작업이 너무 오래 걸립니다.')
        causes.push('무한 루프가 있을 수 있습니다.')
        
        if (failure.testFile.includes('integration')) {
          causes.push('API 모킹이 제대로 되지 않았을 수 있습니다.')
          causes.push('MSW 핸들러를 확인하세요.')
        }
        break
      
      case 'integration-failure':
        causes.push('API 호출이 실패했습니다.')
        causes.push('MSW 설정을 확인하세요.')
        causes.push('네트워크 모킹이 올바르지 않을 수 있습니다.')
        break
      
      default:
        causes.push('원인을 특정할 수 없습니다. 로그를 확인하세요.')
    }

    return causes
  }

  /**
   * 영향받는 파일 식별
   */
  private async identifyAffectedFiles(failure: TestFailure): Promise<string[]> {
    const files: string[] = [failure.testFile]

    // TODO: 스택 트레이스에서 관련 파일 추출
    // TODO: import 관계 분석하여 의존 파일 추가

    return files
  }

  /**
   * 심각도 계산
   */
  private calculateSeverity(
    failure: TestFailure, 
    category: FailureCategory
  ): 'critical' | 'high' | 'medium' | 'low' {
    // 문법 오류나 타입 오류는 critical
    if (category === 'syntax-error' || category === 'type-error') {
      return 'critical'
    }

    // missing implementation은 high
    if (category === 'missing-implementation') {
      return 'high'
    }

    // assertion failure는 medium
    if (category === 'assertion-failure') {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(analyses: FailureAnalysis[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Critical 실패 우선 처리
    const criticalFailures = analyses.filter(a => a.severity === 'critical')
    if (criticalFailures.length > 0) {
      recommendations.push({
        title: '긴급: 문법/타입 오류 수정',
        description: `${criticalFailures.length}개의 치명적인 오류를 먼저 수정해야 합니다.`,
        priority: 1,
        estimatedEffort: 'low',
        suggestedAction: '문법 및 타입 오류를 수정하세요.'
      })
    }

    // Missing implementation 처리
    const missingImpl = analyses.filter(a => a.category === 'missing-implementation')
    if (missingImpl.length > 0) {
      recommendations.push({
        title: '미구현 함수 작성',
        description: `${missingImpl.length}개의 함수가 구현되지 않았습니다.`,
        priority: 2,
        estimatedEffort: 'medium',
        suggestedAction: '누락된 함수를 구현하세요.'
      })
    }

    // Assertion failure 처리
    const assertionFailures = analyses.filter(a => a.category === 'assertion-failure')
    if (assertionFailures.length > 0) {
      recommendations.push({
        title: '로직 검증',
        description: `${assertionFailures.length}개의 테스트가 예상과 다른 결과를 반환합니다.`,
        priority: 3,
        estimatedEffort: 'high',
        suggestedAction: '비즈니스 로직을 검토하고 수정하세요.'
      })
    }

    return recommendations.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 분석 요약 생성
   */
  private generateSummary(analyses: FailureAnalysis[]): string {
    const total = analyses.length
    const critical = analyses.filter(a => a.severity === 'critical').length
    const high = analyses.filter(a => a.severity === 'high').length
    const medium = analyses.filter(a => a.severity === 'medium').length
    const low = analyses.filter(a => a.severity === 'low').length

    let summary = `총 ${total}개의 테스트 실패를 분석했습니다.\n\n`
    summary += `심각도 분포:\n`
    summary += `- Critical: ${critical}개\n`
    summary += `- High: ${high}개\n`
    summary += `- Medium: ${medium}개\n`
    summary += `- Low: ${low}개\n\n`

    if (critical > 0) {
      summary += `⚠️  먼저 ${critical}개의 치명적인 오류를 수정하세요.\n`
    }

    return summary
  }
}

