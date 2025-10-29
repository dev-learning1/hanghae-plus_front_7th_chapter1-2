#!/usr/bin/env node
/**
 * Test Writer 전용 스크립트
 * 
 * .agent/roles/test-writer.md의 역할 명세를 읽고
 * 그에 맞는 테스트 코드를 생성합니다.
 * 
 * 사용법:
 *   pnpm tdd:red --target=src/utils/add.ts --description="두 수를 더하는 함수"
 */

import { TestWriterAgent } from '../../agents/test-writer'
import { loadConfigWithOverrides } from '../config/tdd.config'
import { getFolderManager } from '../agent/utils'
import { parseArgs } from 'node:util'
import fs from 'fs/promises'
import path from 'path'

interface RedOptions {
  target: string
  description?: string
  type?: 'unit' | 'hook' | 'integration'
  verbose: boolean
  help: boolean
}

/**
 * CLI 인자 파싱
 */
function parseRedArgs(): RedOptions {
  const { values } = parseArgs({
    options: {
      target: {
        type: 'string',
        short: 't'
      },
      description: {
        type: 'string',
        short: 'd'
      },
      type: {
        type: 'string'
      },
      verbose: {
        type: 'boolean',
        short: 'v',
        default: false
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false
      }
    }
  })

  return {
    target: values.target || '',
    description: values.description,
    type: (values.type as 'unit' | 'hook' | 'integration') || 'unit',
    verbose: values.verbose || false,
    help: values.help || false
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
TDD RED 단계 (Test Writer)

.agent/roles/test-writer.md의 역할 명세에 따라 테스트 코드를 생성합니다.
src/__tests__/ 폴더의 스타일을 참고하여 동일한 패턴으로 작성합니다.

사용법:
  pnpm tdd:red --target=<file> [options]

필수 옵션:
  -t, --target <file>      테스트할 대상 파일 (예: src/utils/add.ts)

선택 옵션:
  -d, --description <text> 함수/기능 설명
  --type <type>           테스트 타입 (unit|hook|integration, 기본: unit)
  -v, --verbose           상세 로그 출력
  -h, --help              도움말 표시

예제:
  pnpm tdd:red --target=src/utils/add.ts --description="두 수를 더하는 함수"
  pnpm tdd:red --target=src/hooks/useCounter.ts --type=hook
  pnpm tdd:red --target=src/components/Button.tsx --type=integration --verbose
`)
}

/**
 * 배너 출력
 */
function printBanner(): void {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     TDD RED 단계                       ║
║     테스트 작성 및 실행                ║
║                                        ║
╚════════════════════════════════════════╝
`)
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    const options = parseRedArgs()

    // 도움말 표시
    if (options.help) {
      showHelp()
      process.exit(0)
    }

    // target 필수 확인
    if (!options.target) {
      console.error('❌ 에러: --target 옵션이 필요합니다.')
      console.log('\n사용법: pnpm tdd:red --target=src/utils/add.ts\n')
      showHelp()
      process.exit(1)
    }

    // 배너 출력
    printBanner()

    console.log('🔴 RED 단계: Test Writer')
    console.log(`📝 역할 명세: .agent/roles/test-writer.md`)
    console.log(`📚 스타일 참고: src/__tests__/\n`)

    // 필요한 디렉토리 생성
    console.log('📁 디렉토리 구조 확인 중...')
    const folderManager = getFolderManager()
    await folderManager.initializeStructure()
    console.log('✅ 디렉토리 구조 확인 완료\n')

    // 역할 명세 읽기
    console.log('📖 역할 명세 읽는 중...')
    const roleSpecPath = path.join(process.cwd(), '.agent/roles/test-writer.md')
    const roleSpec = await fs.readFile(roleSpecPath, 'utf-8')
    console.log('✅ 역할 명세 로드 완료\n')

    // Test Writer Agent 실행
    console.log('🤖 Test Writer Agent 시작...')
    console.log(`대상 파일: ${options.target}`)
    if (options.description) {
      console.log(`설명: ${options.description}`)
    }
    console.log(`타입: ${options.type}`)
    console.log()

    const agent = new TestWriterAgent()
    
    // 기존 패턴 분석
    console.log('🔍 기존 테스트 패턴 분석 중...')
    await agent.analyzeExistingTests()
    console.log()

    // 테스트 생성
    console.log('✍️  테스트 코드 생성 중...')
    const functionName = path.basename(options.target, path.extname(options.target))
    
    const generatedTest = await agent.generateTest({
      targetFile: options.target,
      functionName,
      description: options.description || `${functionName} 테스트`,
      testType: options.type
    })

    console.log()
    console.log('='.repeat(50))
    console.log('✅ 테스트 코드 생성 완료')
    console.log('='.repeat(50))
    console.log(`파일 위치: ${generatedTest.filePath}`)
    console.log(`설명: ${generatedTest.description}`)
    console.log('='.repeat(50))

    // 생성된 테스트 출력
    console.log('\n📄 생성된 테스트 코드:\n')
    console.log('---')
    console.log(generatedTest.content)
    console.log('---')

    // 리포트 저장 (백업용)
    const reportDir = await folderManager.createReportFolder('test-writer')
    const reportPath = `${reportDir}/generated-test.ts`
    await fs.writeFile(reportPath, generatedTest.content)
    console.log(`\n📄 테스트 백업 저장: ${reportPath}`)

    // infra/generated-tests/ 폴더에 저장 (원본 src/ 폴더는 건드리지 않음)
    console.log('\n💾 생성된 테스트 저장 중...')
    
    // 디렉토리 생성 (존재하지 않을 경우)
    const targetDir = path.dirname(generatedTest.filePath)
    await fs.mkdir(targetDir, { recursive: true })
    
    // 파일 저장
    await fs.writeFile(generatedTest.filePath, generatedTest.content)
    console.log(`✅ 생성된 테스트 저장: ${generatedTest.filePath}`)
    console.log(`📌 원본과 비교: src/__tests__/ vs infra/generated-tests/`)

    // 테스트 실행
    console.log('\n🧪 생성된 테스트 실행 중...\n')
    console.log('='.repeat(50))
    
    const config = await loadConfigWithOverrides()
    
    // 캐시 방지를 위해 동적 import에 타임스탬프 추가
    const { TestRunner } = await import(`../agent/testRunner?t=${Date.now()}`)
    const testRunner = new TestRunner({
      config,
      workingDir: process.cwd(),
      timestamp: new Date().toISOString()
    })

    try {
      console.log('🔧 디버그: runFile 메서드 호출 중...')
      const testResult = await testRunner.runFile(generatedTest.filePath)
      
      console.log('\n' + '='.repeat(50))
      console.log('📊 테스트 실행 결과')
      console.log('='.repeat(50))
      
      if (testResult.allPassed) {
        console.log('✅ 상태: 모든 테스트 통과 (이상적으로는 RED 단계에서 실패해야 합니다)')
        console.log(`   전체: ${testResult.total}개`)
        console.log(`   통과: ${testResult.passed}개`)
      } else {
        console.log('🔴 상태: 테스트 실패 (RED) - 정상입니다!')
        console.log(`   전체: ${testResult.total}개`)
        console.log(`   통과: ${testResult.passed}개`)
        console.log(`   실패: ${testResult.failed}개`)
        
        if (testResult.failures.length > 0) {
          console.log('\n❌ 실패한 테스트:')
          testResult.failures.forEach((failure, index) => {
            console.log(`\n${index + 1}. ${failure.testFile}`)
            console.log(`   테스트: ${failure.testName}`)
            console.log(`   오류: ${failure.error}`)
            if (failure.line) {
              console.log(`   위치: Line ${failure.line}`)
            }
          })
        }
      }
      
      console.log('='.repeat(50))
      
      // 테스트 결과도 리포트에 저장
      const testResultPath = `${reportDir}/test-result.json`
      await fs.writeFile(testResultPath, JSON.stringify(testResult, null, 2))
      console.log(`\n📄 테스트 결과 저장: ${testResultPath}`)

    } catch (error) {
      console.error('\n❌ 테스트 실행 중 에러 발생:')
      console.error(error)
    }

    console.log('\n🎯 다음 단계:')
    console.log('   1. 실패한 테스트 확인 (위 결과 참고)')
    console.log('   2. 구현 코드 작성 (GREEN 단계)')
    console.log('   3. 테스트 재실행: pnpm test')
    console.log('   4. 리팩토링 (REFACTOR 단계)')

  } catch (error) {
    console.error('\n❌ 예기치 않은 에러가 발생했습니다:')
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
main()

