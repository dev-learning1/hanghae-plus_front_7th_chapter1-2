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
import type { TestResult } from '../agent/testRunner'
import { parseArgs } from 'node:util'
import fs from 'fs/promises'
import path from 'path'

type TestType = 'unit' | 'hook' | 'integration'

interface RedOptions {
  target: string
  description?: string
  type: TestType | 'auto'
  verbose: boolean
  help: boolean
}

interface TargetSpec {
  targetFile: string
  description: string
  testType: TestType
}

const DEFAULT_TARGET_DIRS = ['src/hooks', 'src/utils']

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
    type: (values.type as TestType | 'auto') || 'auto',
    verbose: values.verbose || false,
    help: values.help || false
  }
}

function determineTestType(filePath: string, requestedType: RedOptions['type']): TestType {
  if (requestedType && requestedType !== 'auto') return requestedType

  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  if (normalized.includes('/hooks/')) return 'hook'
  if (normalized.includes('/components/') || normalized.includes('/pages/')) return 'integration'
  return 'unit'
}

async function collectTargetFiles(inputPath: string): Promise<string[]> {
  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath)

  try {
    const stat = await fs.stat(absolutePath)

    if (stat.isDirectory()) {
      const files: string[] = []
      const entries = await fs.readdir(absolutePath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(absolutePath, entry.name)

        if (entry.isDirectory()) {
          if (['__tests__', 'generated-tests'].includes(entry.name)) continue
          const nested = await collectTargetFiles(fullPath)
          files.push(...nested)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name)
          if (!['.ts', '.tsx'].includes(ext)) continue
          if (entry.name.endsWith('.d.ts') || entry.name.includes('.spec.')) continue
          files.push(fullPath)
        }
      }

      return files
    }

    if (stat.isFile()) {
      return [absolutePath]
    }
  } catch (error) {
    console.error(`⚠️  대상 경로를 읽을 수 없습니다: ${inputPath}`)
    console.error(error)
  }

  return []
}

async function resolveTargets(targetInputs: string[], options: RedOptions): Promise<TargetSpec[]> {
  const files = await Promise.all(targetInputs.map((input) => collectTargetFiles(input)))
  const flatFiles = [...new Set(files.flat())]

  return flatFiles.map((absPath) => {
    const relativePath = path.relative(process.cwd(), absPath).replace(/\\/g, '/')
    const description = options.description || `${path.basename(absPath, path.extname(absPath))} 테스트`
    const testType = determineTestType(relativePath, options.type)

    return {
      targetFile: relativePath,
      description,
      testType
    }
  })
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
TDD RED 단계 (Test Writer)

.agent/roles/test-writer.md의 역할 명세에 따라 테스트 코드를 생성합니다.
src/__tests__/ 폴더의 스타일을 참고하여 동일한 패턴으로 작성합니다.

기본값으로 \`src/hooks\`, \`src/utils\` 디렉토리를 순회하며 RED 테스트를 생성합니다.

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

    const targetInputs = options.target ? [options.target] : DEFAULT_TARGET_DIRS
    const targetSpecs = await resolveTargets(targetInputs, options)

    if (targetSpecs.length === 0) {
      console.error('❌ 대상 파일이 없습니다. --target 옵션으로 파일 또는 디렉토리를 지정하세요.')
      console.log(`자동 기본 대상: ${DEFAULT_TARGET_DIRS.join(', ')}`)
      process.exit(1)
    }

    // Test Writer Agent 실행
    console.log('🤖 Test Writer Agent 시작...')
    console.log(`대상 개수: ${targetSpecs.length}`)
    if (!options.target) {
      console.log(`자동 대상: ${DEFAULT_TARGET_DIRS.join(', ')}`)
    } else {
      console.log(`지정된 대상: ${options.target}`)
    }
    if (options.description) {
      console.log(`설명(공통): ${options.description}`)
    }
    console.log(`타입 옵션: ${options.type}`)
    console.log()

    const agent = new TestWriterAgent()
    
    // 기존 패턴 분석
    console.log('🔍 기존 테스트 패턴 분석 중...')
    await agent.analyzeExistingTests()
    console.log()

    const reportDir = await folderManager.createReportFolder('test-writer')
    await fs.mkdir(path.join(reportDir, 'generated-tests'), { recursive: true })

    const generatedSummaries: Array<{ filePath: string; description: string }> = []
    const aggregatedResults: Array<{ target: string; result: TestResult }> = []

    const config = await loadConfigWithOverrides()
    const { TestRunner } = await import(`../agent/testRunner?t=${Date.now()}`)
    const testRunner = new TestRunner({
      config,
      workingDir: process.cwd(),
      timestamp: new Date().toISOString()
    })

    for (const spec of targetSpecs) {
      console.log('✍️  테스트 코드 생성 중...')
      console.log(`   대상: ${spec.targetFile}`)
      console.log(`   타입: ${spec.testType}`)

      const functionName = path.basename(spec.targetFile, path.extname(spec.targetFile))

      const generatedTest = await agent.generateTest({
        targetFile: spec.targetFile,
        functionName,
        description: spec.description,
        testType: spec.testType
      })

      console.log('\n📄 생성된 테스트 코드:\n')
      console.log('---')
      console.log(generatedTest.content)
      console.log('---')

      const backupName = `${functionName}.spec.backup.ts`
      const reportPath = path.join(reportDir, 'generated-tests', backupName)
      await fs.writeFile(reportPath, generatedTest.content)
      console.log(`📄 테스트 백업 저장: ${reportPath}`)

      const targetDir = path.dirname(generatedTest.filePath)
      await fs.mkdir(targetDir, { recursive: true })
      await fs.writeFile(generatedTest.filePath, generatedTest.content)
      console.log(`✅ 생성된 테스트 저장: ${generatedTest.filePath}`)
      console.log('='.repeat(50))

      generatedSummaries.push({
        filePath: generatedTest.filePath,
        description: generatedTest.description
      })

      console.log('\n🧪 생성된 테스트 실행 중...\n')
      try {
        const testResult = await testRunner.runFile(generatedTest.filePath)

        aggregatedResults.push({ target: spec.targetFile, result: testResult })

        if (testResult.allPassed) {
          console.log('✅ 상태: 모든 테스트 통과 (RED 단계에서는 실패가 기대되므로 구현 여부 확인 필요)')
        } else {
          console.log('🔴 상태: 테스트 실패 (RED) - 정상입니다!')
        }
        console.log(`   전체: ${testResult.total}개, 통과: ${testResult.passed}개, 실패: ${testResult.failed}개`)

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

        console.log('='.repeat(50))
      } catch (error) {
        console.error('\n❌ 테스트 실행 중 에러 발생:')
        console.error(error)
      }
    }

    const testResultPath = path.join(reportDir, 'test-result.json')
    await fs.writeFile(
      testResultPath,
      JSON.stringify(
        {
          generated: generatedSummaries,
          results: aggregatedResults
        },
        null,
        2
      )
    )
    console.log(`\n📄 테스트 결과 저장: ${testResultPath}`)

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

