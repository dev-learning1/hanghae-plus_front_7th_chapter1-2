/**
 * Test Writer Agent
 * 
 * .agent/roles/test-writer.md의 역할 명세를 따라
 * src/__tests__/ 스타일을 참고하여 테스트 코드를 생성합니다.
 */

import fs from 'fs/promises'
import path from 'path'

interface TestGenerationInput {
  targetFile: string
  functionName?: string
  description?: string
  testType?: 'unit' | 'hook' | 'integration'
}

interface TestGenerationOutput {
  filePath: string
  content: string
  description: string
}

interface TestPattern {
  structure: string
  hookPattern?: string
  integrationPattern?: string
  mockStyle: string
  importOrder: string[]
  testNaming: string // 한글 설명
  edgeCases: boolean // Edge case 포함
}

interface FunctionSignature {
  name: string
  params: string[]
  returnType?: string
}

interface ScenarioSection {
  name: string
  scenarios: string[]
}

export class TestWriterAgent {
  private pattern: TestPattern | null = null
  private roleSpec: string = ''
  private implementations: Map<string, string> = new Map()
  private existingTestContentByTarget: Map<string, string[]> = new Map()

  /**
   * 기존 테스트 패턴 분석 (깊이 있게)
   */
  async analyzeExistingTests(): Promise<void> {
    try {
      const testsDir = path.join(process.cwd(), 'src/__tests__')

      this.pattern = {
        structure: 'describe + it',
        mockStyle: 'MSW handlers',
        testNaming: '한글 설명',
        edgeCases: true,
        importOrder: ['types', 'implementation', 'test utils']
      }

      const testFiles = await this.collectTestFiles(testsDir)

      for (const filePath of testFiles) {
        const content = await fs.readFile(filePath, 'utf-8')
        await this.registerExistingTestContent(filePath, content)

        if (!this.pattern.hookPattern && content.includes('renderHook') && content.includes('act')) {
          this.pattern.hookPattern = 'renderHook + act'
        }
        if (!this.pattern.integrationPattern && content.includes('userEvent.setup')) {
          this.pattern.integrationPattern = 'userEvent + render'
        }
      }
    } catch (error) {
      console.error('⚠️  테스트 패턴 분석 실패, 기본 패턴 사용')
      this.pattern = {
        structure: 'describe + it',
        mockStyle: 'vitest.fn()',
        testNaming: '한글 설명',
        edgeCases: true,
        importOrder: ['external', 'internal', 'mocks']
      }
    }
  }

  /**
   * 역할 명세 로드
   */
  async loadRoleSpec(): Promise<void> {
    const roleSpecPath = path.join(
      process.cwd(),
      '.agent/roles/test-writer.md'
    )
    this.roleSpec = await fs.readFile(roleSpecPath, 'utf-8')
  }

  /**
   * 구현 파일 분석
   */
  async analyzeImplementation(targetFile: string): Promise<FunctionSignature[]> {
    const fullPath = path.join(process.cwd(), targetFile)
    const content = await fs.readFile(fullPath, 'utf-8')
    this.implementations.set(targetFile, content)

    // 함수 시그니처 추출
    const functions: FunctionSignature[] = []
    
    // export function 패턴 (여러 줄에 걸쳐 있을 수 있음)
    const functionRegex = /export\s+function\s+(\w+)\s*\([^)]*\)/gs
    let match
    while ((match = functionRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const name = match[1]
      const paramsMatch = fullMatch.match(/\((.*?)\)/s)
      const params = paramsMatch && paramsMatch[1] 
        ? paramsMatch[1].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean)
        : []
      
      functions.push({
        name,
        params
      })
    }

    return functions
  }

  /**
   * 테스트 코드 생성 (실제 구현 분석 기반)
   */
  async generateTest(input: TestGenerationInput): Promise<TestGenerationOutput> {
    if (!this.pattern) {
      await this.analyzeExistingTests()
    }

    if (!this.roleSpec) {
      await this.loadRoleSpec()
    }

    const { targetFile, testType = 'unit' } = input

    // 실제 구현 파일 분석
    console.log(`   📖 구현 파일 분석 중: ${targetFile}`)
    const functions = await this.analyzeImplementation(targetFile)
    console.log(`   ✅ 추출한 함수: ${functions.map(f => f.name).join(', ')}`)

    // 파일명에서 모듈명 추출
    const moduleName = path.basename(targetFile, path.extname(targetFile))

    // 테스트 파일 경로 결정
    const testFilePath = this.determineTestFilePath(targetFile, testType)

    // 테스트 코드 생성
    let content = ''

    if (testType === 'hook') {
      content = await this.generateHookTest(moduleName, targetFile, testFilePath)
    } else if (testType === 'integration') {
      content = await this.generateIntegrationTest(moduleName, targetFile, testFilePath)
    } else {
      content = await this.generateUnitTest(moduleName, targetFile, functions, testFilePath)
    }

    return {
      filePath: testFilePath,
      content,
      description: `${moduleName} 테스트`
    }
  }

  /**
   * 테스트 파일 경로 결정 (infra/generated-tests/{type}/{role}/ 폴더에 저장)
   */
  private determineTestFilePath(targetFile: string, testType: string): string {
    const fileName = path.basename(targetFile, path.extname(targetFile))
    const role = 'test-writer' // 현재 역할
    
    if (testType === 'hook') {
      return path.join(
        process.cwd(),
        'infra/generated-tests/hooks',
        role,
        `${fileName}.spec.ts`
      )
    } else if (testType === 'integration') {
      return path.join(
        process.cwd(),
        'infra/generated-tests/integration',
        role,
        `${fileName}.integration.spec.tsx`
      )
    } else {
      return path.join(
        process.cwd(),
        'infra/generated-tests/unit',
        role,
        `${fileName}.spec.ts`
      )
    }
  }

  /**
   * 테스트 파일 경로에서 모듈 경로를 추출합니다.
   * 예: 'infra/generated-tests/unit/test-module.spec.ts' -> 'src/test-module'
   */
  private resolveImportPath(testFilePath: string, targetFile: string): string {
    const fromDir = path.dirname(testFilePath)
    const absoluteTarget = path.join(process.cwd(), targetFile)
    const relativePath = path.relative(fromDir, absoluteTarget).replace(/\\/g, '/')
    return relativePath.replace(/\.(ts|tsx)$/i, '')
  }

  /**
   * Unit 테스트 생성 (기존 스타일 참고)
   */
  private async generateUnitTest(
    moduleName: string,
    targetFile: string,
    functions: FunctionSignature[],
    testFilePath: string
  ): Promise<string> {
    const sections = this.extractScenarioSections(targetFile)
    if (sections.length > 0) {
      return this.renderUnitTestFromSections(sections, targetFile, functions, testFilePath)
    }

    const implContent = this.implementations.get(targetFile) || ''
    const hasTypes = implContent.includes('Event') || implContent.includes('interface')
    
    // Import 구문 생성
    let imports = `import { describe, it } from 'vitest'\n`
    
    if (hasTypes) {
      imports += `import { Event } from '../../types'\n`
    }
    
    const funcNames = functions.map(f => f.name).join(', ')
    const relativePath = this.resolveImportPath(testFilePath, targetFile)
    imports += `import { ${funcNames} } from '${relativePath}'\n`

    // 각 함수별 테스트 생성
    let testCases = ''
    for (const func of functions) {
      testCases += this.generateFunctionTestCases(func, implContent)
      testCases += '\n'
    }

    return imports + '\n' + testCases
  }

  /**
   * 각 함수별 테스트 케이스 생성 (기존 테스트 스타일 모방)
   */
  private generateFunctionTestCases(func: FunctionSignature, implContent: string): string {
    // 함수 시그니처 분석
    const hasDateParam = implContent.includes('Date') || func.params.some(p => p.includes('date') || p.includes('Date'))
    const hasArrayParam = implContent.includes('Event[]') || func.params.some(p => p.includes('events'))
    const hasStringParam = func.params.some(p => p.includes('term') || p.includes('string'))
    const hasViewParam = func.params.some(p => p.includes('view'))
    
    // Mock 데이터 생성
    let mockData = ''
    if (hasArrayParam) {
      mockData = `  const mockEvents: Event[] = [
    {
      id: '1',
      title: '테스트 이벤트 1',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명 1',
      location: '장소 1',
      category: '카테고리 1',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '테스트 이벤트 2',
      date: '2025-07-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '설명 2',
      location: '장소 2',
      category: '카테고리 2',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
  ]
`
    }

    // 테스트 케이스 생성
    const testCases: string[] = []
    
    // 1. 기본 동작 테스트 (RED: 테스트 케이스 의도만)
    testCases.push(`  it('정상적인 입력에 대해 올바른 결과를 반환한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    
    // 2. Edge case 1 - 빈 입력 (RED: 테스트 케이스 의도만)
    if (hasArrayParam) {
      testCases.push(`  it('빈 배열에 대해 빈 결과를 반환한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    }
    
    // 3. Edge case 2 - 검색어 관련 (RED: 테스트 케이스 의도만)
    if (hasStringParam) {
      testCases.push(`  it('검색어가 빈 문자열일 때 모든 결과를 반환한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
      
      testCases.push(`  it('검색어가 대소문자 구분 없이 작동한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    }
    
    // 4. View 관련 테스트 (RED: 테스트 케이스 의도만)
    if (hasViewParam) {
      testCases.push(`  it("주간 뷰('week')로 필터링이 작동한다", () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
      
      testCases.push(`  it("월간 뷰('month')로 필터링이 작동한다", () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    }
    
    // 5. 날짜 관련 Edge case (RED: 테스트 케이스 의도만)
    if (hasDateParam && hasArrayParam) {
      testCases.push(`  it('월의 경계에 있는 데이터를 올바르게 처리한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    }
    
    // 6. 복합 조건 테스트 (RED: 테스트 케이스 의도만)
    if (hasStringParam && hasViewParam) {
      testCases.push(`  it('검색어와 뷰 필터를 동시에 적용한다', () => {
    // TODO: 테스트 구현 필요
    throw new Error('Not implemented')
  })`)
    }

    return `describe('${func.name}', () => {
${mockData}
${testCases.join('\n\n')}
})`
  }

  /**
   * 함수 인자 생성 헬퍼
   */
  private generateFunctionArgs(
    func: FunctionSignature,
    hasArrayParam: boolean,
    hasStringParam: boolean,
    hasDateParam: boolean,
    hasViewParam: boolean
  ): string {
    const args: string[] = []
    if (hasArrayParam) args.push('events')
    if (hasStringParam) args.push('searchTerm')
    if (hasDateParam) args.push('date')
    if (hasViewParam) args.push('view')
    return args.join(', ')
  }

  /**
   * Hook 테스트 생성 (기존 스타일 참고)
   */
  private async generateHookTest(moduleName: string, targetFile: string, testFilePath: string): Promise<string> {
    const sections = this.extractScenarioSections(targetFile)
    if (sections.length > 0) {
      return this.renderHookTestFromSections(moduleName, sections, targetFile, testFilePath)
    }

    const relativeImport = this.resolveImportPath(testFilePath, targetFile)

    return `/**
 * @intent ${moduleName} 훅의 상태 흐름을 명세한다
 * @risk-level high
 */
import { describe, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ${moduleName} } from '${relativeImport}'

describe('${moduleName}', () => {
  it('기본 상태를 제공한다', () => {
    renderHook(() => ${moduleName}())
    throw new Error('Not implemented')
  })

  it('상태 전이를 처리한다', () => {
    const { result } = renderHook(() => ${moduleName}())
    act(() => {
      // TODO: 상태 전이 액션 수행
    })
    throw new Error('Not implemented')
  })
})
`
  }

  /**
   * Integration 테스트 생성 (기존 스타일 참고)
   */
  private async generateIntegrationTest(
    moduleName: string,
    targetFile: string,
    testFilePath: string
  ): Promise<string> {
    const sections = this.extractScenarioSections(targetFile)
    if (sections.length > 0) {
      return this.renderIntegrationTestFromSections(moduleName, sections, targetFile, testFilePath)
    }

    const relativeImport = this.resolveImportPath(testFilePath, targetFile)

    return `/**
 * @intent ${moduleName} 컴포넌트의 상호작용 흐름을 명세한다
 * @risk-level high
 */
import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ${moduleName} } from '${relativeImport}'

describe('${moduleName} Integration Test', () => {
  it('기본 렌더링을 검증한다', () => {
    render(<${moduleName} />)
    throw new Error('Not implemented')
  })

  it('사용자 인터랙션을 검증한다', async () => {
    render(<${moduleName} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /TODO/i }))
    throw new Error('Not implemented')
  })
})
`
  }

  /**
   * 테스트 파일을 수집합니다.
   */
  private async collectTestFiles(dir: string): Promise<string[]> {
    const result: string[] = []

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          result.push(...await this.collectTestFiles(fullPath))
        } else if (/\.spec\.(ts|tsx)$/.test(entry.name)) {
          result.push(fullPath)
        }
      }
    } catch (error) {
      console.error(`⚠️  테스트 파일 탐색 중 오류: ${dir}`, error)
    }

    return result
  }

  /**
   * 기존 테스트 콘텐츠를 등록합니다.
   */
  private async registerExistingTestContent(testFilePath: string, content: string): Promise<void> {
    const importRegex = /import[^;]+from\s+['"](.+?)['"]/g
    const testDir = path.dirname(testFilePath)

    let match: RegExpExecArray | null
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]

      let resolvedPath: string | null = null

      if (importPath.startsWith('.')) {
        resolvedPath = await this.resolveModulePath(path.resolve(testDir, importPath))
      } else if (importPath.startsWith('@/')) {
        resolvedPath = await this.resolveModulePath(path.resolve(process.cwd(), 'src', importPath.slice(2)))
      }

      if (!resolvedPath) continue

      const normalized = path.normalize(resolvedPath).replace(/\\/g, '/')
      if (!normalized.includes('/src/')) continue

      const entries = this.existingTestContentByTarget.get(normalized) ?? []
      entries.push(content)
      this.existingTestContentByTarget.set(normalized, entries)
    }
  }

  private async resolveModulePath(basePath: string): Promise<string | null> {
    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      `${basePath}.jsx`
    ]

    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate)
        if (stat.isFile()) return candidate
      } catch {
        // ignore
      }
    }

    return null
  }

  private renderUnitTestFromSections(
    sections: ScenarioSection[],
    targetFile: string,
    functions: FunctionSignature[],
    testFilePath: string
  ): string {
    const funcNames = functions.map(f => f.name).join(', ')
    const relativePath = this.resolveImportPath(testFilePath, targetFile)

    const imports: string[] = [`import { describe, it } from 'vitest'`]

    const body: string[] = []
    for (const section of sections) {
      if (section.scenarios.length === 0) continue
      body.push(`describe('${section.name}', () => {`)
      for (const scenario of section.scenarios) {
        body.push(`  it('${scenario}', () => {`)
        body.push(`    throw new Error('Not implemented')`)
        body.push(`  })`)
      }
      body.push(`})`)
      body.push('')
    }

    return `${imports.join('\n')}

${body.join('\n')}`.trim() + '\n'
  }

  private renderHookTestFromSections(
    hookName: string,
    sections: ScenarioSection[],
    targetFile: string,
    testFilePath: string
  ): string {
    const relativePath = this.resolveImportPath(testFilePath, targetFile)

    const imports = [
      `import { describe, it } from 'vitest'`,
      `import { renderHook, act } from '@testing-library/react'`,
      `import { ${hookName} } from '${relativePath}'`
    ]

    const body: string[] = []
    for (const section of sections) {
      if (section.scenarios.length === 0) continue
      body.push(`describe('${section.name}', () => {`)
      for (const scenario of section.scenarios) {
        body.push(`  it('${scenario}', () => {`)
        body.push(`    const { result } = renderHook(() => ${hookName}())`)
        body.push(`    act(() => {`)
        body.push(`      // TODO: 상태 전이 작업`)
        body.push(`    })`)
        body.push(`    throw new Error('Not implemented')`)
        body.push(`  })`)
      }
      body.push(`})`)
      body.push('')
    }

    return `${imports.join('\n')}

${body.join('\n')}`.trim() + '\n'
  }

  private renderIntegrationTestFromSections(
    componentName: string,
    sections: ScenarioSection[],
    targetFile: string,
    testFilePath: string
  ): string {
    const relativePath = this.resolveImportPath(testFilePath, targetFile)

    const imports = [
      `import { describe, it } from 'vitest'`,
      `import { render, screen } from '@testing-library/react'`,
      `import userEvent from '@testing-library/user-event'`,
      `import { ${componentName} } from '${relativePath}'`
    ]

    const body: string[] = []
    for (const section of sections) {
      if (section.scenarios.length === 0) continue
      body.push(`describe('${section.name}', () => {`)
      for (const scenario of section.scenarios) {
        body.push(`  it('${scenario}', async () => {`)
        body.push(`    render(<${componentName} />)`)
        body.push(`    const user = userEvent.setup()`)
        body.push(`    // TODO: 사용자 상호작용 시나리오 구성`)
        body.push(`    await user.click(screen.getByRole('button', { name: /TODO/i }))`)
        body.push(`    throw new Error('Not implemented')`)
        body.push(`  })`)
      }
      body.push(`})`)
      body.push('')
    }

    return `${imports.join('\n')}

${body.join('\n')}`.trim() + '\n'
  }

  private extractScenarioSections(targetFile: string): ScenarioSection[] {
    const normalized = path.normalize(path.join(process.cwd(), targetFile)).replace(/\\/g, '/')
    const contents = this.existingTestContentByTarget.get(normalized)
    if (!contents || contents.length === 0) return []

    const sectionMap = new Map<string, Set<string>>()

    for (const content of contents) {
      const sections = this.parseDescribeSections(content)
      for (const section of sections) {
        if (section.scenarios.length === 0) continue
        const key = section.name
        if (!sectionMap.has(key)) sectionMap.set(key, new Set())
        const set = sectionMap.get(key)!
        section.scenarios.forEach((scenario) => set.add(scenario))
      }
    }

    return Array.from(sectionMap.entries()).map(([name, scenarioSet]) => ({
      name,
      scenarios: Array.from(scenarioSet)
    }))
  }

  private parseDescribeSections(content: string): ScenarioSection[] {
    const sections: ScenarioSection[] = []
    const describeRegex = /describe\s*\(\s*(['"`])(.*?)\1\s*,/g
    let match: RegExpExecArray | null

    while ((match = describeRegex.exec(content)) !== null) {
      const name = match[2]
      const blockStart = content.indexOf('{', describeRegex.lastIndex)
      if (blockStart === -1) continue
      const blockEnd = this.findMatchingBrace(content, blockStart)
      if (blockEnd === -1) continue
      const body = content.slice(blockStart + 1, blockEnd)

      const scenarios: string[] = []
      const itRegex = /it\s*\(\s*(['"`])(.*?)\1/g
      let itMatch: RegExpExecArray | null
      while ((itMatch = itRegex.exec(body)) !== null) {
        scenarios.push(itMatch[2])
      }

      sections.push({ name, scenarios })
    }

    return sections
  }

  private findMatchingBrace(content: string, openIndex: number): number {
    let depth = 0
    let inString: string | null = null
    let escape = false

    for (let i = openIndex; i < content.length; i++) {
      const char = content[i]

      if (inString) {
        if (escape) {
          escape = false
          continue
        }
        if (char === '\\') {
          escape = true
          continue
        }
        if (char === inString) {
          inString = null
        }
        continue
      }

      if (char === '"' || char === '\'' || char === '`') {
        inString = char
        continue
      }

      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) return i
      }
    }

    return -1
  }
}
