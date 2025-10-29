#!/usr/bin/env node
/**
 * TDD 자동화 시스템 실행 스크립트
 * 
 * 사용법:
 *   pnpm tdd:run                    # 기본 실행
 *   pnpm tdd:run --config=custom    # 커스텀 설정 사용
 *   pnpm tdd:run --dry-run          # Dry run 모드
 */

import { runTDDAgent } from '../agent/index'
import { loadConfigWithOverrides } from '../config/tdd.config'
import { getFolderManager } from '../agent/utils'
import { parseArgs } from 'node:util'
import fs from 'fs/promises'
import path from 'path'

interface CLIOptions {
  config?: string
  dryRun: boolean
  verbose: boolean
  help: boolean
}

/**
 * CLI 인자 파싱
 */
function parseCLIArgs(): CLIOptions {
  const { values } = parseArgs({
    options: {
      config: {
        type: 'string',
        short: 'c'
      },
      'dry-run': {
        type: 'boolean',
        default: false
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
    config: values.config,
    dryRun: values['dry-run'] || false,
    verbose: values.verbose || false,
    help: values.help || false
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
TDD 자동화 시스템

사용법:
  pnpm tdd:run [options]

옵션:
  -c, --config <file>   설정 파일 경로 (기본: tdd.config.ts)
  --dry-run            실제 수정 없이 미리보기만 실행
  -v, --verbose        상세 로그 출력
  -h, --help           도움말 표시

예제:
  pnpm tdd:run
  pnpm tdd:run --config=custom.config.ts
  pnpm tdd:run --dry-run --verbose
`)
}

/**
 * 배너 출력
 */
function printBanner(): void {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     TDD 자동화 시스템                  ║
║     Test-Driven Development            ║
║     Automation System                  ║
║                                        ║
╚════════════════════════════════════════╝
`)
}

/**
 * 폴더 생성 (존재하지 않으면)
 */
async function ensureDirectories(): Promise<void> {
  const folderManager = getFolderManager()
  await folderManager.initializeStructure()
}

/**
 * 실행 전 검증
 */
async function preflightCheck(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  // package.json 존재 확인
  try {
    await fs.access('package.json')
  } catch {
    errors.push('package.json을 찾을 수 없습니다.')
  }

  // src 디렉토리 존재 확인
  try {
    await fs.access('src')
  } catch {
    errors.push('src 디렉토리를 찾을 수 없습니다.')
  }

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    const options = parseCLIArgs()

    // 도움말 표시
    if (options.help) {
      showHelp()
      process.exit(0)
    }

    // 배너 출력
    printBanner()

    console.log('🚀 TDD 자동화 시스템을 시작합니다...\n')

    // 사전 검증
    console.log('📋 사전 검증 중...')
    const checkResult = await preflightCheck()
    if (!checkResult.success) {
      console.error('❌ 사전 검증 실패:')
      checkResult.errors.forEach(err => console.error(`  - ${err}`))
      process.exit(1)
    }
    console.log('✅ 사전 검증 완료\n')

    // 필요한 디렉토리 생성
    console.log('📁 디렉토리 구조 생성 중...')
    await ensureDirectories()
    console.log('✅ 디렉토리 구조 생성 완료\n')

    // 설정 로드
    console.log('⚙️  설정 로드 중...')
    const config = await loadConfigWithOverrides(options.config)
    
    if (options.verbose) {
      console.log('설정:', JSON.stringify(config, null, 2))
    }
    console.log('✅ 설정 로드 완료\n')

    // Dry run 모드 확인
    if (options.dryRun) {
      console.log('⚠️  Dry-run 모드: 실제 파일 수정은 하지 않습니다.\n')
    }

    // TDD 에이전트 실행
    console.log('🤖 TDD 에이전트 실행 중...\n')
    const startTime = Date.now()
    
    const result = await runTDDAgent(config)
    
    const duration = Date.now() - startTime

    // 결과 출력
    console.log('\n' + '='.repeat(50))
    console.log('📊 실행 결과')
    console.log('='.repeat(50))
    console.log(`상태: ${result.success ? '✅ 성공' : '❌ 실패'}`)
    console.log(`메시지: ${result.message}`)
    console.log(`소요 시간: ${duration}ms`)
    
    if (result.data) {
      console.log(`\n상세 정보:`)
      console.log(JSON.stringify(result.data, null, 2))
    }

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  에러 목록:`)
      result.errors.forEach(err => console.log(`  - ${err}`))
    }

    console.log('='.repeat(50))

    // 리포트 위치 안내
    console.log('\n📄 상세 리포트는 다음 위치에서 확인할 수 있습니다:')
    console.log('  - infra/reports/tdd-agent/latest.md')
    console.log('  - infra/overview/tdd-session-summary.md')

    // 종료 코드 설정
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('\n❌ 예기치 않은 에러가 발생했습니다:')
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
main()

