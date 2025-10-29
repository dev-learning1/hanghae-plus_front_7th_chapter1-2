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

export class TestWriterAgent {
  private pattern: TestPattern | null = null
  private roleSpec: string = ''
  private existingTests: Map<string, string> = new Map()
  private implementations: Map<string, string> = new Map()

  /**
   * 기존 테스트 패턴 분석 (깊이 있게)
   */
  async analyzeExistingTests(): Promise<void> {
    try {
      const testsDir = path.join(process.cwd(), 'src/__tests__')
      
      // 패턴 초기화
      this.pattern = {
        structure: 'describe + it',
        mockStyle: 'MSW handlers',
        testNaming: '한글 설명',
        edgeCases: true,
        importOrder: [
          'types',
          'implementation',
          'test utils'
        ]
      }

      // Unit 테스트 예제 읽기 (깊이 분석)
      const unitDir = path.join(testsDir, 'unit')
      try {
        const unitFiles = await fs.readdir(unitDir)
        for (const file of unitFiles.slice(0, 2)) { // 2개만 샘플링
          const content = await fs.readFile(path.join(unitDir, file), 'utf-8')
          const fileName = path.basename(file, '.spec.ts')
          this.existingTests.set(fileName, content)
        }
      } catch (err) {
        // unit 디렉토리가 없을 수 있음
      }

      // Hook 테스트 예제 읽기
      const hooksDir = path.join(testsDir, 'hooks')
      try {
        const hookFiles = await fs.readdir(hooksDir)
        for (const file of hookFiles.slice(0, 2)) {
          const content = await fs.readFile(path.join(hooksDir, file), 'utf-8')
          const fileName = path.basename(file, '.spec.ts')
          this.existingTests.set(fileName, content)
          
          if (content.includes('renderHook') && content.includes('act')) {
            this.pattern.hookPattern = 'renderHook + act'
          }
        }
      } catch (err) {
        // hooks 디렉토리가 없을 수 있음
      }

      // Integration 테스트 예제 읽기
      try {
        const integrationFiles = await fs.readdir(testsDir)
        const integrationFile = integrationFiles.find(f => f.includes('integration'))
        
        if (integrationFile) {
          const content = await fs.readFile(
            path.join(testsDir, integrationFile),
            'utf-8'
          )
          this.existingTests.set('integration-sample', content)
          
          if (content.includes('userEvent') && content.includes('MSW')) {
            this.pattern.integrationPattern = 'userEvent + MSW'
          }
        }
      } catch (err) {
        // integration 파일이 없을 수 있음
      }

      console.log('✅ 테스트 패턴 분석 완료:')
      console.log(`   - 구조: ${this.pattern.structure}`)
      console.log(`   - 테스트 명명: ${this.pattern.testNaming}`)
      console.log(`   - Edge Cases: ${this.pattern.edgeCases ? '포함' : '미포함'}`)
      console.log(`   - 분석한 기존 테스트: ${this.existingTests.size}개`)
      if (this.pattern.hookPattern) {
        console.log(`   - Hook 패턴: ${this.pattern.hookPattern}`)
      }
      if (this.pattern.integrationPattern) {
        console.log(`   - Integration 패턴: ${this.pattern.integrationPattern}`)
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
      content = await this.generateHookTest(moduleName, targetFile)
    } else if (testType === 'integration') {
      content = await this.generateIntegrationTest(moduleName, targetFile)
    } else {
      content = await this.generateUnitTest(moduleName, targetFile, functions)
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
   * Unit 테스트 생성 (기존 스타일 참고)
   */
  private async generateUnitTest(
    moduleName: string,
    targetFile: string,
    functions: FunctionSignature[]
  ): Promise<string> {
    const implContent = this.implementations.get(targetFile) || ''
    const hasTypes = implContent.includes('Event') || implContent.includes('interface')
    
    // Import 구문 생성
    let imports = `import { describe, it, expect } from 'vitest'\n`
    
    if (hasTypes) {
      imports += `import { Event } from '../../types'\n`
    }
    
    const funcNames = functions.map(f => f.name).join(', ')
    const relativePath = targetFile.replace('src/', '../../')
    imports += `import { ${funcNames} } from '${relativePath.replace('.ts', '')}'\n`

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
  private async generateHookTest(moduleName: string, targetFile: string): Promise<string> {
    const hookName = moduleName
    
    return `import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ${hookName} } from '../../hooks/${hookName}'

describe('초기 상태', () => {
  it('훅이 올바르게 초기화된다', () => {
    const { result } = renderHook(() => ${hookName}())

    expect(result.current).toBeDefined()
    // TODO: 초기 상태 검증
  })
})

it('상태 변경이 올바르게 동작한다', () => {
  const { result } = renderHook(() => ${hookName}())

  act(() => {
    // TODO: 액션 호출
  })

  // TODO: 변경된 상태 검증
  expect(true).toBe(true)
})
`
  }

  /**
   * Integration 테스트 생성 (기존 스타일 참고)
   */
  private async generateIntegrationTest(
    moduleName: string,
    targetFile: string
  ): Promise<string> {
    const componentName = moduleName
    
    return `import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ${componentName} } from '../${componentName}'

describe('${componentName} Integration Test', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  describe('사용자 인터랙션', () => {
    it('사용자 액션이 올바르게 동작한다', async () => {
      render(<${componentName} />)

      // TODO: 사용자 액션 테스트
      expect(true).toBe(true)
    })
  })
})
`
  }
}
