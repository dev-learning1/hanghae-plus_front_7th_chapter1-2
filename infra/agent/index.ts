/**
 * TDD 에이전트 메인 엔트리 포인트
 * 
 * 이 파일은 TDD 자동화 시스템의 진입점으로,
 * 모든 에이전트를 초기화하고 조율합니다.
 */

import { TestRunner } from './testRunner'
import { Analyzer } from './analyzer'
import { Fixer } from './fixer'
import { Reporter } from './reporter'
import type { TDDConfig } from '../config/tdd.config'

export interface AgentContext {
  config: TDDConfig
  workingDir: string
  timestamp: string
}

export interface AgentResult {
  success: boolean
  message: string
  data?: unknown
  errors?: string[]
}

/**
 * TDD 에이전트 오케스트레이터
 * 전체 TDD 사이클을 관리합니다.
 */
export class TDDAgent {
  private testRunner: TestRunner
  private analyzer: Analyzer
  private fixer: Fixer
  private reporter: Reporter
  private context: AgentContext

  constructor(context: AgentContext) {
    this.context = context
    this.testRunner = new TestRunner(context)
    this.analyzer = new Analyzer(context)
    this.fixer = new Fixer(context)
    this.reporter = new Reporter(context)
  }

  /**
   * TDD 사이클 실행
   * Red -> Green -> Refactor 순서로 진행
   */
  async runCycle(): Promise<AgentResult> {
    console.log('🚀 TDD 사이클 시작...')
    
    try {
      // 1. Red: 테스트 실행
      console.log('📝 [Red] 테스트 실행 중...')
      const testResult = await this.testRunner.run()
      
      if (testResult.allPassed) {
        console.log('✅ 모든 테스트 통과!')
        return {
          success: true,
          message: '모든 테스트가 통과했습니다.',
          data: testResult
        }
      }

      // 2. Analyze: 실패 원인 분석
      console.log('🔍 [Analyze] 테스트 실패 분석 중...')
      const analysis = await this.analyzer.analyze(testResult)

      // 3. Green: 구현 생성/수정
      console.log('🔧 [Green] 구현 코드 생성 중...')
      const fixResult = await this.fixer.fix(analysis)

      // 4. 재테스트
      console.log('🔄 테스트 재실행 중...')
      const retestResult = await this.testRunner.run()

      // 5. 리포트 생성
      console.log('📊 리포트 생성 중...')
      await this.reporter.generate({
        initialTest: testResult,
        analysis,
        fix: fixResult,
        finalTest: retestResult
      })

      return {
        success: retestResult.allPassed,
        message: retestResult.allPassed 
          ? 'TDD 사이클 완료: 모든 테스트 통과' 
          : 'TDD 사이클 완료: 일부 테스트 실패',
        data: {
          testResult: retestResult,
          analysis,
          fixResult
        }
      }
    } catch (error) {
      console.error('❌ TDD 사이클 중 에러 발생:', error)
      return {
        success: false,
        message: 'TDD 사이클 실행 중 에러가 발생했습니다.',
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  /**
   * Watch 모드로 실행
   * 파일 변경 감지 시 자동으로 TDD 사이클 재실행
   */
  async watch(): Promise<void> {
    console.log('👀 Watch 모드 시작...')
    console.log('파일 변경을 감지하면 자동으로 테스트를 실행합니다.')
    console.log('종료하려면 Ctrl+C를 누르세요.\n')

    // TODO: 파일 시스템 감시 구현
    // - chokidar 또는 fs.watch 사용
    // - 변경 감지 시 runCycle() 호출
    // - debounce 적용하여 중복 실행 방지
  }
}

/**
 * 에이전트 초기화 및 실행
 */
export async function runTDDAgent(config: TDDConfig): Promise<AgentResult> {
  const context: AgentContext = {
    config,
    workingDir: process.cwd(),
    timestamp: new Date().toISOString()
  }

  const agent = new TDDAgent(context)
  return await agent.runCycle()
}

export async function watchTDDAgent(config: TDDConfig): Promise<void> {
  const context: AgentContext = {
    config,
    workingDir: process.cwd(),
    timestamp: new Date().toISOString()
  }

  const agent = new TDDAgent(context)
  await agent.watch()
}

