/**
 * TDD 자동화 시스템 설정
 */

export interface TDDConfig {
  // 프로젝트 설정
  projectName: string
  projectRoot: string

  // 테스트 설정
  testCommand: string
  testFramework: 'jest' | 'vitest' | 'mocha'
  testPattern: string
  coverageThreshold: CoverageThreshold

  // 에이전트 설정
  agents: AgentConfig

  // 리포트 설정
  reports: ReportConfig

  // 파일 시스템 설정
  filesystem: FilesystemConfig

  // 백업 설정
  createBackup: boolean
  backupDir: string
}

export interface CoverageThreshold {
  lines: number
  statements: number
  functions: number
  branches: number
}

export interface AgentConfig {
  testWriter: TestWriterConfig
  implGenerator: ImplGeneratorConfig
  testRunner: TestRunnerConfig
  analyzer: AnalyzerConfig
}

export interface TestWriterConfig {
  template: 'jest' | 'vitest' | 'mocha'
  pattern: 'given-when-then' | 'arrange-act-assert' | 'custom'
  includeEdgeCases: boolean
  generateComments: boolean
}

export interface ImplGeneratorConfig {
  style: 'minimal-first' | 'complete' | 'stub'
  autoRefactor: boolean
  preferFunctional: boolean
  strictMode: boolean
}

export interface TestRunnerConfig {
  parallel: boolean
  timeout: number
  retries: number
  bail: boolean
}

export interface AnalyzerConfig {
  enableAI: boolean
  detailedAnalysis: boolean
  prioritization: 'severity' | 'frequency' | 'impact'
}

export interface ReportConfig {
  outputDir: string
  formats: ('json' | 'markdown' | 'html')[]
  includeDetails: boolean
  retention: {
    enabled: boolean
    days: number
  }
}

export interface FilesystemConfig {
  watchMode: boolean
  watchPatterns: string[]
  ignorePatterns: string[]
}

/**
 * 기본 설정
 */
export const defaultConfig: TDDConfig = {
  projectName: 'My Project',
  projectRoot: process.cwd(),

  testCommand: 'pnpm test',
  testFramework: 'vitest',
  testPattern: '**/*.{test,spec}.{ts,tsx}',
  coverageThreshold: {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 75
  },

  agents: {
    testWriter: {
      template: 'vitest',
      pattern: 'given-when-then',
      includeEdgeCases: true,
      generateComments: true
    },
    implGenerator: {
      style: 'minimal-first',
      autoRefactor: true,
      preferFunctional: true,
      strictMode: true
    },
    testRunner: {
      parallel: true,
      timeout: 5000,
      retries: 0,
      bail: false
    },
    analyzer: {
      enableAI: false,
      detailedAnalysis: true,
      prioritization: 'severity'
    }
  },

  reports: {
    outputDir: 'infra/reports',
    formats: ['json', 'markdown'],
    includeDetails: true,
    retention: {
      enabled: true,
      days: 30
    }
  },

  filesystem: {
    watchMode: false,
    watchPatterns: ['src/**/*.ts', 'src/**/*.tsx'],
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**'
    ]
  },

  createBackup: true,
  backupDir: 'infra/tmp/backups'
}

/**
 * 설정 로드
 */
export function loadConfig(customConfig?: Partial<TDDConfig>): TDDConfig {
  return {
    ...defaultConfig,
    ...customConfig
  }
}

/**
 * 설정 검증
 */
export function validateConfig(config: TDDConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 필수 필드 검증
  if (!config.projectName) {
    errors.push('projectName is required')
  }

  if (!config.testCommand) {
    errors.push('testCommand is required')
  }

  // 커버리지 임계값 검증
  const { lines, statements, functions, branches } = config.coverageThreshold
  if (lines < 0 || lines > 100) {
    errors.push('coverageThreshold.lines must be between 0 and 100')
  }
  if (statements < 0 || statements > 100) {
    errors.push('coverageThreshold.statements must be between 0 and 100')
  }
  if (functions < 0 || functions > 100) {
    errors.push('coverageThreshold.functions must be between 0 and 100')
  }
  if (branches < 0 || branches > 100) {
    errors.push('coverageThreshold.branches must be between 0 and 100')
  }

  // 타임아웃 검증
  if (config.agents.testRunner.timeout < 0) {
    errors.push('testRunner.timeout must be positive')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 환경 변수에서 설정 로드
 */
export function loadConfigFromEnv(): Partial<TDDConfig> {
  const config: Partial<TDDConfig> = {}
  
  if (process.env.TDD_PROJECT_NAME) {
    config.projectName = process.env.TDD_PROJECT_NAME
  }
  
  if (process.env.TDD_TEST_COMMAND) {
    config.testCommand = process.env.TDD_TEST_COMMAND
  }
  
  if (process.env.TDD_CREATE_BACKUP) {
    config.createBackup = process.env.TDD_CREATE_BACKUP === 'true'
  }
  
  return config
}

/**
 * 설정 파일에서 로드
 */
export async function loadConfigFromFile(filePath: string): Promise<Partial<TDDConfig>> {
  try {
    const module = await import(filePath)
    return module.default || module.config
  } catch (error) {
    console.warn(`Failed to load config from ${filePath}:`, error)
    return {}
  }
}

/**
 * 통합 설정 로드
 * 우선순위: 파일 > 환경변수 > 기본값
 */
export async function loadConfigWithOverrides(
  configFile?: string
): Promise<TDDConfig> {
  // 1. 기본값으로 시작
  let config: TDDConfig = { ...defaultConfig }

  // 2. 환경변수에서 로드 (값이 있는 것만 덮어씀)
  const envConfig = loadConfigFromEnv()
  if (Object.keys(envConfig).length > 0) {
    config = { 
      ...config, 
      ...Object.fromEntries(
        Object.entries(envConfig).filter(([_, v]) => v !== undefined)
      ) as Partial<TDDConfig>
    }
  }

  // 3. 설정 파일에서 로드 (값이 있는 것만 덮어씀)
  if (configFile) {
    const fileConfig = await loadConfigFromFile(configFile)
    if (Object.keys(fileConfig).length > 0) {
      config = { 
        ...config, 
        ...Object.fromEntries(
          Object.entries(fileConfig).filter(([_, v]) => v !== undefined)
        ) as Partial<TDDConfig>
      }
    }
  }

  // 4. 검증
  const validation = validateConfig(config)
  if (!validation.valid) {
    throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
  }

  return config
}

