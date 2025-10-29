#!/usr/bin/env node
/**
 * TDD Watch 모드 실행 스크립트
 * 
 * 파일 변경을 감지하고 자동으로 TDD 사이클을 실행합니다.
 * 
 * 사용법:
 *   pnpm tdd:watch                  # 기본 watch 모드
 *   pnpm tdd:watch --debounce=1000  # 디바운스 시간 설정
 */

import { watchTDDAgent } from '../agent/index'
import { loadConfigWithOverrides } from '../config/tdd.config'
import { parseArgs } from 'node:util'
import chokidar from 'chokidar'
import path from 'path'

interface WatchOptions {
  config?: string
  debounce: number
  verbose: boolean
  help: boolean
}

/**
 * CLI 인자 파싱
 */
function parseWatchArgs(): WatchOptions {
  const { values } = parseArgs({
    options: {
      config: {
        type: 'string',
        short: 'c'
      },
      debounce: {
        type: 'string',
        default: '500'
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
    debounce: parseInt(values.debounce || '500', 10),
    verbose: values.verbose || false,
    help: values.help || false
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
TDD Watch 모드

사용법:
  pnpm tdd:watch [options]

옵션:
  -c, --config <file>     설정 파일 경로
  --debounce <ms>         디바운스 시간 (기본: 500ms)
  -v, --verbose           상세 로그 출력
  -h, --help              도움말 표시

단축키:
  Ctrl+C                  종료
  r                       모든 테스트 재실행
  c                       콘솔 클리어
  ?                       도움말

예제:
  pnpm tdd:watch
  pnpm tdd:watch --debounce=1000 --verbose
`)
}

/**
 * 배너 출력
 */
function printBanner(): void {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     TDD Watch 모드                     ║
║     파일 변경을 감지합니다             ║
║                                        ║
╚════════════════════════════════════════╝
`)
}

/**
 * 파일 변경 감지 및 처리
 */
async function watchFiles(
  patterns: string[],
  ignorePatterns: string[],
  debounceMs: number,
  onChangeFn: (filePath: string) => Promise<void>
): Promise<void> {
  let timeoutId: NodeJS.Timeout | null = null
  let changedFiles = new Set<string>()

  const watcher = chokidar.watch(patterns, {
    ignored: ignorePatterns,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  })

  // 변경 감지
  const handleChange = (filePath: string) => {
    changedFiles.add(filePath)

    // 디바운스 처리
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(async () => {
      const files = Array.from(changedFiles)
      changedFiles.clear()

      console.log(`\n📝 ${files.length}개 파일 변경 감지:`)
      files.forEach(f => console.log(`  - ${path.relative(process.cwd(), f)}`))
      console.log()

      for (const file of files) {
        await onChangeFn(file)
      }

      console.log('\n👀 변경 감지 대기 중... (Ctrl+C로 종료)')
    }, debounceMs)
  }

  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', filePath => {
      console.log(`\n🗑️  파일 삭제: ${path.relative(process.cwd(), filePath)}`)
    })
    .on('error', error => {
      console.error(`\n❌ Watcher 에러:`, error)
    })

  console.log('👀 파일 변경 감지 중...')
  console.log('감시 패턴:', patterns)
  console.log('무시 패턴:', ignorePatterns)
  console.log()
  console.log('단축키:')
  console.log('  r - 모든 테스트 재실행')
  console.log('  c - 콘솔 클리어')
  console.log('  q - 종료')
  console.log('  ? - 도움말')
  console.log()
}

/**
 * 키보드 입력 처리
 */
function setupKeyboardHandlers(
  onRunAll: () => Promise<void>,
  onClear: () => void,
  onHelp: () => void
): void {
  // stdin을 raw 모드로 설정
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  process.stdin.on('data', async (key: string) => {
    // Ctrl+C 또는 q
    if (key === '\u0003' || key === 'q') {
      console.log('\n👋 Watch 모드를 종료합니다...')
      process.exit(0)
    }

    // r: 모든 테스트 재실행
    if (key === 'r') {
      console.log('\n🔄 모든 테스트를 재실행합니다...\n')
      await onRunAll()
    }

    // c: 콘솔 클리어
    if (key === 'c') {
      onClear()
      console.log('✨ 콘솔을 클리어했습니다.\n')
    }

    // ?: 도움말
    if (key === '?') {
      onHelp()
    }
  })
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    const options = parseWatchArgs()

    // 도움말 표시
    if (options.help) {
      showHelp()
      process.exit(0)
    }

    // 배너 출력
    printBanner()

    console.log('🚀 TDD Watch 모드를 시작합니다...\n')

    // 설정 로드
    console.log('⚙️  설정 로드 중...')
    const config = await loadConfigWithOverrides(options.config)
    
    if (options.verbose) {
      console.log('설정:', JSON.stringify(config, null, 2))
    }
    console.log('✅ 설정 로드 완료\n')

    // 변경 핸들러
    const handleChange = async (filePath: string) => {
      try {
        console.log(`🧪 테스트 실행 중...`)
        const startTime = Date.now()

        // TODO: 파일별로 관련 테스트만 실행하도록 최적화
        await watchTDDAgent(config)

        const duration = Date.now() - startTime
        console.log(`✅ 완료 (${duration}ms)`)
      } catch (error) {
        console.error('❌ 테스트 실행 중 에러:', error)
      }
    }

    const handleRunAll = async () => {
      await handleChange('all')
    }

    const handleClear = () => {
      console.clear()
      printBanner()
    }

    const handleHelp = () => {
      showHelp()
    }

    // 키보드 핸들러 설정
    setupKeyboardHandlers(handleRunAll, handleClear, handleHelp)

    // 파일 변경 감지 시작
    await watchFiles(
      config.filesystem.watchPatterns,
      config.filesystem.ignorePatterns,
      options.debounce,
      handleChange
    )

    // 초기 실행
    console.log('🎬 초기 테스트를 실행합니다...\n')
    await handleChange('initial')

  } catch (error) {
    console.error('\n❌ 예기치 않은 에러가 발생했습니다:')
    console.error(error)
    process.exit(1)
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n\n👋 Watch 모드를 종료합니다...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n👋 Watch 모드를 종료합니다...')
  process.exit(0)
})

// 스크립트 실행
main()

