/**
 * Test Runner
 * 
 * 테스트를 실행하고 결과를 수집합니다.
 */

import { spawn } from 'child_process'
import type { AgentContext } from './index'

export interface TestResult {
  timestamp: string
  allPassed: boolean
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage?: CoverageResult
  failures: TestFailure[]
  rawOutput: string
}

export interface CoverageResult {
  lines: number
  statements: number
  functions: number
  branches: number
}

export interface TestFailure {
  testName: string
  testFile: string
  error: string
  stack?: string
  line?: number
}

/**
 * 테스트 실행 담당 클래스
 */
export class TestRunner {
  private context: AgentContext

  constructor(context: AgentContext) {
    this.context = context
  }

  /**
   * 테스트 실행 (실시간 출력)
   */
  async run(options: {
    coverage?: boolean
    watch?: boolean
    pattern?: string
  } = {}): Promise<TestResult> {
    const { coverage = false, watch = false, pattern } = options

    console.log('🧪 테스트 실행 준비...')
    
    try {
      // 테스트 명령어 구성
      const baseCommand = this.context.config.testCommand || 'pnpm test'
      const [command, ...baseArgs] = baseCommand.split(' ')

      let finalCommand = command
      let args: string[] = [...baseArgs]

      if (pattern) {
        if (command === 'pnpm') {
          finalCommand = 'pnpm'
          args = ['vitest', 'run', pattern]
          if (coverage) args.push('--coverage')
        } else {
          finalCommand = 'vitest'
          args = ['run', pattern]
          if (coverage) args.push('--coverage')
        }
      } else {
        const scriptArgs: string[] = []
        if (coverage) scriptArgs.push('--coverage')
        if (!watch) scriptArgs.push('--run')
        const isPnpmScript = command === 'pnpm' && baseArgs.length > 0
        if (isPnpmScript && scriptArgs.length > 0) {
          args.push('--', ...scriptArgs)
        } else if (!isPnpmScript) {
          args.push(...scriptArgs)
        }
      }

      console.log(`실행 명령어: ${finalCommand} ${args.join(' ')}`)
      console.log('') // 빈 줄
      
      const startTime = Date.now()
      
      // spawn으로 실시간 출력
      const { output, exitCode } = await this.runCommand(finalCommand, args)

      const duration = Date.now() - startTime

      // 결과 파싱
      const result = this.parseTestOutput(output, duration, exitCode)

      console.log('') // 빈 줄
      if (result.allPassed) {
        console.log(`✅ 테스트 완료: ${result.passed}/${result.total} 통과`)
      } else {
        console.log(`🔴 테스트 실패: ${result.failed}/${result.total} 실패`)
      }
      
      return result
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류 발생:', error)
      throw error
    }
  }

  /**
   * 명령어 실행 (실시간 출력)
   */
  private runCommand(command: string, args: string[]): Promise<{ output: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      let output = ''
      
      const proc = spawn(command, args, {
        cwd: this.context.workingDir,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      proc.stdout?.on('data', (data) => {
        const text = data.toString()
        process.stdout.write(text) // 실시간 출력
        output += text
      })

      proc.stderr?.on('data', (data) => {
        const text = data.toString()
        process.stderr.write(text) // 실시간 출력
        output += text
      })

      proc.on('close', (code) => {
        resolve({ output, exitCode: code ?? 0 })
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * 테스트 출력 파싱
   * Vitest 출력 형식을 파싱합니다.
   */
  private parseTestOutput(output: string, duration: number, exitCode: number): TestResult {
    const sanitize = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, '')
    const normalizedOutput = sanitize(output)
    const failures: TestFailure[] = []
    
    // Vitest 출력 파싱
    // ❯ src/__tests__/hooks/easy.useSearch.spec.ts  (5 tests)  
    //   × 검색어가 비어있을 때 모든 이벤트를 반환해야 한다
    
    // FAIL 패턴 추출
    const failureBlocks = normalizedOutput.split(/(?=❯|FAIL)/g)
    
    for (const block of failureBlocks) {
      if (block.includes('×') || block.includes('FAIL')) {
        // 파일명 추출
        const fileMatch = block.match(/❯?\s*(.+?\.spec\.(?:ts|tsx))/)
        const testFile = fileMatch ? fileMatch[1].trim() : 'Unknown File'
        
        // 실패한 테스트 이름들 추출
        const testNameMatches = block.matchAll(/[×✕]\s+(.+?)(?:\n|$)/g)
        
        for (const match of testNameMatches) {
          const testName = match[1].trim()
          
          // 에러 메시지 추출
          const errorMatch = block.match(/Error:\s*(.+?)(?:\n|$)/)
          const assertionMatch = block.match(/AssertionError:\s*(.+?)(?:\n|$)/)
          const error = errorMatch ? errorMatch[1] : 
                       assertionMatch ? assertionMatch[1] : 
                       'Test failed'
          
          // 스택 트레이스 추출
          const stackMatch = block.match(/at\s+(.+?):(\d+):(\d+)/)
          const line = stackMatch ? parseInt(stackMatch[2], 10) : undefined
          
          failures.push({
            testName,
            testFile,
            error,
            stack: stackMatch ? stackMatch[0] : undefined,
            line
          })
        }
      }
    }
    
    // 통계 정보 추출
    let total = 0
    let passed = 0
    let failed = 0
    let skipped = 0
    
    const statsRegex = /Tests?\s+(?:(\d+)\s+failed)?\s*(?:\|\s*(\d+)\s+passed)?\s*(?:\|\s*(\d+)\s+skipped)?\s*\((\d+)\)/
    const statsMatch = normalizedOutput.match(statsRegex)
    if (statsMatch) {
      failed = statsMatch[1] ? parseInt(statsMatch[1], 10) : 0
      passed = statsMatch[2] ? parseInt(statsMatch[2], 10) : 0
      skipped = statsMatch[3] ? parseInt(statsMatch[3], 10) : 0
      total = statsMatch[4] ? parseInt(statsMatch[4], 10) : failed + passed + skipped
    } else {
      const fallbackPassed = normalizedOutput.match(/(\d+)\s+passed/)
      const fallbackFailed = normalizedOutput.match(/(\d+)\s+failed/)
      const fallbackSkipped = normalizedOutput.match(/(\d+)\s+skipped/)

      passed = fallbackPassed ? parseInt(fallbackPassed[1], 10) : 0
      failed = fallbackFailed ? parseInt(fallbackFailed[1], 10) : failures.length
      skipped = fallbackSkipped ? parseInt(fallbackSkipped[1], 10) : 0
      total = passed + failed + skipped
    }

    if (exitCode !== 0 && failed === 0) {
      failed = failures.length || 1
    }
    if (!total) {
      total = passed + failed + skipped
    }

    return {
      timestamp: new Date().toISOString(),
      allPassed: exitCode === 0 && failures.length === 0 && failed === 0,
      total: total || (passed + failed + skipped),
      passed,
      failed: failed || failures.length,
      skipped,
      duration,
      failures,
      rawOutput: normalizedOutput
    }
  }

  /**
   * 특정 파일의 테스트만 실행
   */
  async runFile(filePath: string): Promise<TestResult> {
    return this.run({ pattern: filePath })
  }

  /**
   * 커버리지 포함하여 실행
   */
  async runWithCoverage(): Promise<TestResult> {
    return this.run({ coverage: true })
  }
}

