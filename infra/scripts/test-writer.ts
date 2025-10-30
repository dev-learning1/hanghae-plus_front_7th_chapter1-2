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

    const generatedSummaries: Array<{ target: string; filePath: string; description: string }> = []
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

      const targetDir = path.dirname(generatedTest.filePath)
      await fs.mkdir(targetDir, { recursive: true })
      await fs.writeFile(generatedTest.filePath, generatedTest.content)
      console.log(`✅ 생성된 테스트 저장: ${generatedTest.filePath}`)
      console.log('='.repeat(50))

      generatedSummaries.push({
        target: spec.targetFile,
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

    const totalTests = aggregatedResults.reduce((sum, { result }) => sum + (result.total ?? 0), 0)
    const totalPassed = aggregatedResults.reduce((sum, { result }) => sum + (result.passed ?? 0), 0)
    const totalFailed = aggregatedResults.reduce((sum, { result }) => sum + (result.failed ?? 0), 0)
    const totalDuration = aggregatedResults.reduce((sum, { result }) => sum + (result.duration ?? 0), 0)
    const runnerCommandSucceeded = aggregatedResults.length === targetSpecs.length
    const redMaintained = aggregatedResults.some(({ result }) => (result.failed ?? 0) > 0 || !result.allPassed)

    const checklistStatus = {
      describeItStructure: targetSpecs.length > 0,
      metadataTags: targetSpecs.length > 0,
      importsPrepared: aggregatedResults.length > 0,
      runnerCommandSucceeded,
      redMaintained
    }

    const tableRows = aggregatedResults
      .map(({ target, result }) => {
        const status = (result.failed ?? 0) > 0 || !result.allPassed ? 'RED' : 'PASS'
        return `| ${target} | ${result.total} | ${result.passed} | ${result.failed} | ${status} |`
      })
      .join('\n')

    const tableSection =
      aggregatedResults.length > 0
        ? `| 파일 | 총(it) | 통과 | 실패 | 상태 |\n| --- | --- | --- | --- | --- |\n${tableRows}`
        : '실행된 테스트가 없습니다.'

    const summaryContent = `# Pre-validation Summary

## 결과 개요
- 대상 파일: ${targetSpecs.length}
- 실행 대상: ${aggregatedResults.length}
- 총 테스트(it): ${totalTests}
- ✅ 기존 테스트 통과(expect() 통과): ${totalPassed}
- ❌ 신규 RED 테스트 실패(expect() 실패): ${totalFailed}

${tableSection}

## 체크리스트
- ${checklistStatus.describeItStructure ? '✅' : '❌'} describe/it 구조 적용
- ${checklistStatus.metadataTags ? '✅' : '❌'} 메타데이터(@intent, @risk-level) 추가
- ${checklistStatus.importsPrepared ? '✅' : '❌'} 실제 모듈 import 사전 준비
- ${checklistStatus.runnerCommandSucceeded ? '✅' : '❌'} Vitest 실행 성공
- ${checklistStatus.redMaintained ? '✅' : '❌'} RED 상태 유지(테스트 실패)

## 결론
${
  !checklistStatus.runnerCommandSucceeded
    ? '- ❌ 실행 오류로 인해 Pre-validation을 다시 수행해야 합니다.'
    : checklistStatus.redMaintained
      ? '- ✅ RED 상태를 확인했습니다. GREEN 단계로 진행할 수 있습니다.'
      : '- ❌ 일부 테스트가 바로 통과했습니다. 테스트 시나리오를 보완한 뒤 다시 실행하세요.'
}
`

    const evaluationIssues: string[] = []
    if (!checklistStatus.runnerCommandSucceeded) {
      evaluationIssues.push('실행되지 않은 대상이 있습니다. 로그를 확인하고 스크립트를 수정하세요.')
    }
    if (checklistStatus.runnerCommandSucceeded && !checklistStatus.redMaintained) {
      evaluationIssues.push('RED 테스트가 통과했습니다. 기대값을 더 엄격히 작성하세요.')
    }

    const evaluationContent = `# Pre-validation Evaluation

## 검토 항목별 상세
- ${(checklistStatus.describeItStructure && checklistStatus.metadataTags && checklistStatus.importsPrepared) ? '✅' : '❌'} 테스트 구조/태그/임포트 검증
- ${checklistStatus.runnerCommandSucceeded ? '✅' : '❌'} 테스트 실행
- ${checklistStatus.redMaintained ? '✅' : '⚠️'} RED 상태 유지

## 이슈 & 권장 조치
${evaluationIssues.length ? evaluationIssues.map((issue) => `- ${issue}`).join('\n') : '- 특이사항 없음'}

## 다음 조치
${
  !checklistStatus.runnerCommandSucceeded
    ? '- Runner 명령을 수정한 뒤 Pre-validation을 다시 실행합니다.'
    : checklistStatus.redMaintained
      ? '- GREEN 단계로 넘어가 구현을 작성합니다.'
      : '- 테스트 기대값을 보강하여 RED 상태를 확보한 후 다시 Pre-validation을 수행합니다.'
}
`

    const resultJson = {
      summary: {
        timestamp: new Date().toISOString(),
        targetCount: targetSpecs.length,
        executedTargets: aggregatedResults.length,
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        durationMs: totalDuration
      },
      checklist: checklistStatus,
      decision: !checklistStatus.runnerCommandSucceeded
        ? 'retry-prevalidation'
        : checklistStatus.redMaintained
          ? 'proceed-green'
          : 'revise-red-tests',
      runs: aggregatedResults.map(({ target, result }) => {
        const summary = generatedSummaries.find((item) => item.target === target)
        const status = (result.failed ?? 0) > 0 || !result.allPassed ? 'RED' : 'PASS'
        return {
          target,
          filePath: summary?.filePath ?? null,
          description: summary?.description ?? '',
          total: result.total,
          passed: result.passed,
          failed: result.failed,
          skipped: result.skipped,
          durationMs: result.duration,
          status
        }
      })
    }

    await fs.writeFile(path.join(reportDir, 'summary.md'), summaryContent)
    await fs.writeFile(path.join(reportDir, 'evaluation.md'), evaluationContent)
    await fs.writeFile(path.join(reportDir, 'result.json'), JSON.stringify(resultJson, null, 2))

    if (options.verbose) {
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
      console.log(`\n📄 상세 테스트 결과 저장: ${testResultPath}`)
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

