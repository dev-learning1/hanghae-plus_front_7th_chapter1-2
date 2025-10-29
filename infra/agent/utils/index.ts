/**
 * 유틸리티 함수 모음
 */

export * from './folderManager'

/**
 * 시간 포맷팅 유틸리티
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  
  const seconds = ms / 1000
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = (seconds % 60).toFixed(0)
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * 날짜 포맷팅
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 퍼센트 계산
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 10) / 10 // 소수점 1자리
}

/**
 * 색상 코드 (터미널 출력용)
 */
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
}

/**
 * 색상이 적용된 로그
 */
export function colorLog(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * 성공 메시지
 */
export function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

/**
 * 에러 메시지
 */
export function logError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`)
}

/**
 * 경고 메시지
 */
export function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

/**
 * 정보 메시지
 */
export function logInfo(message: string): void {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`)
}

/**
 * 진행률 바 생성
 */
export function createProgressBar(
  current: number,
  total: number,
  width: number = 40
): string {
  const percentage = total === 0 ? 0 : (current / total)
  const filled = Math.round(width * percentage)
  const empty = width - filled

  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const percent = calculatePercentage(current, total)

  return `[${bar}] ${percent}% (${current}/${total})`
}

/**
 * 테이블 형식 출력
 */
export function printTable(data: Record<string, string | number>[]): void {
  if (data.length === 0) return

  const keys = Object.keys(data[0])
  const widths = keys.map(key => {
    const maxContentWidth = Math.max(...data.map(row => String(row[key]).length))
    return Math.max(key.length, maxContentWidth)
  })

  // 헤더
  const header = keys.map((key, i) => key.padEnd(widths[i])).join(' | ')
  console.log(header)
  console.log(widths.map(w => '-'.repeat(w)).join('-+-'))

  // 데이터
  data.forEach(row => {
    const line = keys.map((key, i) => String(row[key]).padEnd(widths[i])).join(' | ')
    console.log(line)
  })
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Debounce 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 파일 경로 정규화 (크로스 플랫폼)
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

/**
 * 상대 경로 계산
 */
export function getRelativePath(from: string, to: string): string {
  const path = require('path')
  return normalizePath(path.relative(from, to))
}

