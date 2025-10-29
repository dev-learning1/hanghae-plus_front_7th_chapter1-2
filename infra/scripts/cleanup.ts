#!/usr/bin/env node
/**
 * 리포트 및 임시 파일 정리 스크립트
 * 
 * 사용법:
 *   pnpm tdd:clean              # 기본 정리 (30일 이상)
 *   pnpm tdd:clean --days=7     # 7일 이상 정리
 *   pnpm tdd:clean --all        # 전체 정리
 */

import { getFolderManager } from '../agent/utils'
import { parseArgs } from 'node:util'

interface CleanupOptions {
  days?: number
  all: boolean
  backups: boolean
  help: boolean
}

/**
 * CLI 인자 파싱
 */
function parseCleanupArgs(): CleanupOptions {
  const { values } = parseArgs({
    options: {
      days: {
        type: 'string',
        default: '30'
      },
      all: {
        type: 'boolean',
        default: false
      },
      backups: {
        type: 'boolean',
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
    days: values.days ? parseInt(values.days, 10) : 30,
    all: values.all || false,
    backups: values.backups || false,
    help: values.help || false
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
TDD 리포트 정리

사용법:
  pnpm tdd:clean [options]

옵션:
  --days <number>   지정한 일수보다 오래된 리포트 삭제 (기본: 30)
  --all             모든 리포트 삭제
  --backups         백업 파일도 정리
  -h, --help        도움말 표시

예제:
  pnpm tdd:clean
  pnpm tdd:clean --days=7
  pnpm tdd:clean --all
  pnpm tdd:clean --backups
`)
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    const options = parseCleanupArgs()

    if (options.help) {
      showHelp()
      process.exit(0)
    }

    console.log('\n🧹 TDD 리포트 정리 시작...\n')

    const folderManager = getFolderManager()

    // 디스크 사용량 확인 (정리 전)
    console.log('📊 현재 디스크 사용량:')
    const beforeUsage = await folderManager.getDiskUsage()
    console.log(`  - 리포트: ${folderManager.formatSize(beforeUsage.reports)}`)
    console.log(`  - 임시 파일: ${folderManager.formatSize(beforeUsage.tmp)}`)
    console.log(`  - 총합: ${folderManager.formatSize(beforeUsage.total)}`)
    console.log()

    // 리포트 정리
    if (options.all) {
      console.log('⚠️  모든 리포트를 삭제합니다...')
      await folderManager.cleanOldReports(0)
    } else {
      await folderManager.cleanOldReports(options.days || 30)
    }

    // 백업 정리
    if (options.backups) {
      console.log()
      await folderManager.cleanBackups()
    }

    // 디스크 사용량 확인 (정리 후)
    console.log()
    console.log('📊 정리 후 디스크 사용량:')
    const afterUsage = await folderManager.getDiskUsage()
    console.log(`  - 리포트: ${folderManager.formatSize(afterUsage.reports)}`)
    console.log(`  - 임시 파일: ${folderManager.formatSize(afterUsage.tmp)}`)
    console.log(`  - 총합: ${folderManager.formatSize(afterUsage.total)}`)

    const saved = beforeUsage.total - afterUsage.total
    if (saved > 0) {
      console.log()
      console.log(`✅ 정리 완료! ${folderManager.formatSize(saved)} 절약했습니다.`)
    } else {
      console.log()
      console.log('✅ 정리할 항목이 없습니다.')
    }

  } catch (error) {
    console.error('\n❌ 정리 중 에러가 발생했습니다:')
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
main()

