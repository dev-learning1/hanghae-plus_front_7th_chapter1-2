/**
 * Test Pattern Analyzer
 * 
 * 사용자의 기존 테스트 패턴을 분석하여 새 테스트 작성 시 참고합니다.
 */

import fs from 'fs/promises'
import path from 'path'

export interface TestPattern {
  framework: 'vitest' | 'jest' | 'mocha'
  library: 'react-testing-library' | 'enzyme' | 'none'
  style: 'describe-it' | 'test' | 'mixed'
  commonImports: string[]
  mockPatterns: string[]
  sampleTests: TestExample[]
}

export interface TestExample {
  filePath: string
  testName: string
  structure: string
  imports: string[]
}

/**
 * 테스트 패턴 분석기
 */
export class TestPatternAnalyzer {
  private testDir: string

  constructor(testDir: string = 'src/__tests__') {
    this.testDir = testDir
  }

  /**
   * 테스트 파일들을 분석하여 패턴 추출
   */
  async analyzePatterns(): Promise<TestPattern> {
    const testFiles = await this.findTestFiles()
    
    if (testFiles.length === 0) {
      return this.getDefaultPattern()
    }

    const samples = await this.analyzeSamples(testFiles.slice(0, 5))
    
    return {
      framework: this.detectFramework(samples),
      library: this.detectLibrary(samples),
      style: this.detectStyle(samples),
      commonImports: this.extractCommonImports(samples),
      mockPatterns: this.extractMockPatterns(samples),
      sampleTests: samples
    }
  }

  /**
   * 테스트 파일 찾기
   */
  private async findTestFiles(): Promise<string[]> {
    const files: string[] = []
    
    const scan = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            await scan(fullPath)
          } else if (entry.isFile() && /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      } catch {
        // 디렉토리 접근 실패 시 무시
      }
    }

    await scan(this.testDir)
    return files
  }

  /**
   * 샘플 테스트 분석
   */
  private async analyzeSamples(files: string[]): Promise<TestExample[]> {
    const samples: TestExample[] = []

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        const sample = this.parseTestFile(file, content)
        if (sample) {
          samples.push(sample)
        }
      } catch {
        // 파일 읽기 실패 시 무시
      }
    }

    return samples
  }

  /**
   * 테스트 파일 파싱
   */
  private parseTestFile(filePath: string, content: string): TestExample | null {
    // Import 추출
    const imports = this.extractImports(content)
    
    // 테스트 이름 추출
    const testNameMatch = content.match(/(?:it|test|describe)\(['"`](.+?)['"`]/)
    const testName = testNameMatch ? testNameMatch[1] : 'Unknown Test'

    // 구조 파악
    const structure = this.analyzeStructure(content)

    return {
      filePath: path.relative(process.cwd(), filePath),
      testName,
      structure,
      imports
    }
  }

  /**
   * Import 문 추출
   */
  private extractImports(content: string): string[] {
    const importRegex = /^import .+ from ['"](.+?)['"];?$/gm
    const imports: string[] = []
    let match

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    return imports
  }

  /**
   * 테스트 구조 분석
   */
  private analyzeStructure(content: string): string {
    const hasDescribe = /describe\s*\(/.test(content)
    const hasIt = /\bit\s*\(/.test(content)
    const hasTest = /\btest\s*\(/.test(content)
    const hasRenderHook = /renderHook\s*\(/.test(content)
    const hasRender = /render\s*\(/.test(content)
    const hasUserEvent = /userEvent/.test(content)

    const parts = []
    if (hasDescribe) parts.push('describe')
    if (hasIt) parts.push('it')
    if (hasTest) parts.push('test')
    if (hasRenderHook) parts.push('renderHook')
    if (hasRender) parts.push('render')
    if (hasUserEvent) parts.push('userEvent')

    return parts.join('+')
  }

  /**
   * 프레임워크 감지
   */
  private detectFramework(samples: TestExample[]): 'vitest' | 'jest' | 'mocha' {
    const allImports = samples.flatMap(s => s.imports)
    
    if (allImports.some(i => i.includes('vitest'))) {
      return 'vitest'
    }
    if (allImports.some(i => i === '@jest/globals' || i.includes('jest'))) {
      return 'jest'
    }
    return 'vitest' // 기본값
  }

  /**
   * 라이브러리 감지
   */
  private detectLibrary(samples: TestExample[]): 'react-testing-library' | 'enzyme' | 'none' {
    const allImports = samples.flatMap(s => s.imports)
    
    if (allImports.some(i => i.includes('@testing-library/react'))) {
      return 'react-testing-library'
    }
    if (allImports.some(i => i.includes('enzyme'))) {
      return 'enzyme'
    }
    return 'none'
  }

  /**
   * 테스트 스타일 감지
   */
  private detectStyle(samples: TestExample[]): 'describe-it' | 'test' | 'mixed' {
    const structures = samples.map(s => s.structure)
    const hasDescribe = structures.some(s => s.includes('describe'))
    const hasIt = structures.some(s => s.includes('it'))
    const hasTest = structures.some(s => s.includes('test'))

    if (hasDescribe && (hasIt || hasTest)) {
      return 'describe-it'
    }
    if (hasTest && !hasDescribe) {
      return 'test'
    }
    return 'mixed'
  }

  /**
   * 공통 Import 추출
   */
  private extractCommonImports(samples: TestExample[]): string[] {
    const importCounts = new Map<string, number>()

    for (const sample of samples) {
      for (const imp of sample.imports) {
        importCounts.set(imp, (importCounts.get(imp) || 0) + 1)
      }
    }

    // 50% 이상의 파일에서 사용되는 import만 추출
    const threshold = Math.ceil(samples.length * 0.5)
    return Array.from(importCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([imp, _]) => imp)
      .sort()
  }

  /**
   * Mock 패턴 추출
   */
  private extractMockPatterns(samples: TestExample[]): string[] {
    const patterns: Set<string> = new Set()

    for (const sample of samples) {
      // 샘플 파일에서 mock 패턴 찾기
      // 실제 구현에서는 파일 내용을 다시 읽어서 분석해야 함
      patterns.add('msw')
      patterns.add('vi.fn()')
    }

    return Array.from(patterns)
  }

  /**
   * 기본 패턴 반환
   */
  private getDefaultPattern(): TestPattern {
    return {
      framework: 'vitest',
      library: 'react-testing-library',
      style: 'describe-it',
      commonImports: [
        '@testing-library/react',
        '@testing-library/user-event',
        'vitest'
      ],
      mockPatterns: ['msw', 'vi.fn()'],
      sampleTests: []
    }
  }

  /**
   * 테스트 템플릿 생성
   */
  generateTestTemplate(
    pattern: TestPattern,
    targetFile: string,
    functionName: string
  ): string {
    const imports = this.generateImports(pattern, targetFile)
    const testStructure = this.generateTestStructure(pattern, functionName)

    return `${imports}\n\n${testStructure}`
  }

  /**
   * Import 문 생성
   */
  private generateImports(pattern: TestPattern, targetFile: string): string {
    const imports: string[] = []

    // 타겟 파일 import
    const relativePath = path.relative(
      path.dirname('src/__tests__'),
      targetFile
    ).replace(/\\/g, '/')
    imports.push(`import { functionName } from '${relativePath}'`)

    // 테스트 라이브러리 imports
    if (pattern.library === 'react-testing-library') {
      if (targetFile.includes('hook')) {
        imports.push(`import { renderHook, act } from '@testing-library/react'`)
      } else {
        imports.push(`import { render, screen } from '@testing-library/react'`)
        imports.push(`import { userEvent } from '@testing-library/user-event'`)
      }
    }

    // 타입 imports
    if (targetFile.endsWith('.ts') || targetFile.endsWith('.tsx')) {
      imports.push(`import type { /* types */ } from '../types'`)
    }

    return imports.join('\n')
  }

  /**
   * 테스트 구조 생성
   */
  private generateTestStructure(pattern: TestPattern, functionName: string): string {
    if (pattern.style === 'describe-it' || pattern.style === 'mixed') {
      return `describe('${functionName}', () => {
  it('should work correctly', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = ${functionName}(input)
    
    // Assert
    expect(result).toBeDefined()
  })

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  })
})`
    } else {
      return `test('${functionName} should work correctly', () => {
  // Arrange
  const input = 'test'
  
  // Act
  const result = ${functionName}(input)
  
  // Assert
  expect(result).toBeDefined()
})`
    }
  }
}

