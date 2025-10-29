/**
 * Code Fixer
 * 
 * 테스트를 통과시키기 위한 코드를 생성하거나 수정합니다.
 */

import fs from 'fs/promises'
import path from 'path'
import type { AgentContext } from './index'
import type { AnalysisResult, FailureAnalysis } from './analyzer'

export interface FixResult {
  timestamp: string
  fixes: CodeFix[]
  success: boolean
  message: string
}

export interface CodeFix {
  file: string
  type: FixType
  description: string
  changes: CodeChange[]
  applied: boolean
}

export type FixType = 
  | 'create-file'
  | 'add-function'
  | 'modify-function'
  | 'fix-syntax'
  | 'fix-type'
  | 'add-import'

export interface CodeChange {
  lineNumber?: number
  oldCode?: string
  newCode: string
  reason: string
}

/**
 * 코드 수정 담당 클래스
 */
export class Fixer {
  private context: AgentContext

  constructor(context: AgentContext) {
    this.context = context
  }

  /**
   * 분석 결과를 바탕으로 코드 수정
   */
  async fix(analysis: AnalysisResult): Promise<FixResult> {
    console.log('🔧 코드 수정 시작...')
    console.log(`${analysis.failures.length}개의 실패 케이스 수정 시도...`)

    const fixes: CodeFix[] = []
    let successCount = 0

    for (const failureAnalysis of analysis.failures) {
      try {
        const fix = await this.generateFix(failureAnalysis)
        const applied = await this.applyFix(fix)
        
        fix.applied = applied
        fixes.push(fix)
        
        if (applied) {
          successCount++
          console.log(`✅ 수정 완료: ${fix.file}`)
        } else {
          console.log(`⚠️  수정 실패: ${fix.file}`)
        }
      } catch (error) {
        console.error(`❌ 수정 중 에러: ${failureAnalysis.failure.testFile}`, error)
        fixes.push({
          file: failureAnalysis.failure.testFile,
          type: 'modify-function',
          description: `수정 실패: ${error instanceof Error ? error.message : String(error)}`,
          changes: [],
          applied: false
        })
      }
    }

    const success = successCount > 0

    return {
      timestamp: new Date().toISOString(),
      fixes,
      success,
      message: success 
        ? `${successCount}/${fixes.length}개 수정 완료`
        : '수정된 항목이 없습니다.'
    }
  }

  /**
   * 개별 실패 케이스에 대한 수정 생성
   */
  private async generateFix(failureAnalysis: FailureAnalysis): Promise<CodeFix> {
    const { failure, category, possibleCauses, affectedFiles } = failureAnalysis

    // 수정 타입 결정
    const fixType = this.determineFixType(category)

    // 수정 내용 생성
    const changes = await this.generateChanges(failureAnalysis)

    return {
      file: affectedFiles[0] || failure.testFile,
      type: fixType,
      description: this.generateDescription(failureAnalysis),
      changes,
      applied: false
    }
  }

  /**
   * 수정 타입 결정
   */
  private determineFixType(category: string): FixType {
    switch (category) {
      case 'syntax-error':
        return 'fix-syntax'
      case 'type-error':
        return 'fix-type'
      case 'missing-implementation':
        return 'add-function'
      default:
        return 'modify-function'
    }
  }

  /**
   * 수정 사항 생성
   */
  private async generateChanges(failureAnalysis: FailureAnalysis): Promise<CodeChange[]> {
    // TODO: AI 또는 휴리스틱 기반으로 실제 코드 변경 내용 생성
    // 현재는 템플릿만 반환

    const changes: CodeChange[] = []

    if (failureAnalysis.category === 'missing-implementation') {
      changes.push({
        newCode: this.generateStubImplementation(failureAnalysis),
        reason: '누락된 함수 구현 추가'
      })
    }

    return changes
  }

  /**
   * 스텁 구현 생성
   */
  private generateStubImplementation(failureAnalysis: FailureAnalysis): string {
    // TODO: 테스트 코드를 분석하여 함수 시그니처 추출
    // TODO: 기본 구현 생성

    return `
export function placeholderFunction(): void {
  // TODO: Implement this function
  throw new Error('Not implemented')
}
`
  }

  /**
   * 수정 설명 생성
   */
  private generateDescription(failureAnalysis: FailureAnalysis): string {
    const { category, possibleCauses } = failureAnalysis
    
    let description = `[${category}] `
    
    if (possibleCauses.length > 0) {
      description += possibleCauses[0]
    } else {
      description += '문제 해결 시도'
    }

    return description
  }

  /**
   * 수정 사항 적용
   */
  private async applyFix(fix: CodeFix): Promise<boolean> {
    try {
      const filePath = path.resolve(this.context.workingDir, fix.file)

      // 파일이 존재하는지 확인
      let fileExists = true
      try {
        await fs.access(filePath)
      } catch {
        fileExists = false
      }

      if (fix.type === 'create-file' || !fileExists) {
        // 새 파일 생성
        await this.createFile(filePath, fix.changes)
        return true
      }

      // 기존 파일 수정
      const content = await fs.readFile(filePath, 'utf-8')
      const newContent = this.applyChanges(content, fix.changes)
      
      // 백업 생성 (선택사항)
      if (this.context.config.createBackup) {
        await fs.writeFile(`${filePath}.backup`, content)
      }

      await fs.writeFile(filePath, newContent)
      return true
    } catch (error) {
      console.error(`파일 수정 실패: ${fix.file}`, error)
      return false
    }
  }

  /**
   * 새 파일 생성
   */
  private async createFile(filePath: string, changes: CodeChange[]): Promise<void> {
    const content = changes.map(c => c.newCode).join('\n\n')
    
    // 디렉토리 생성
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    // 파일 생성
    await fs.writeFile(filePath, content)
  }

  /**
   * 변경사항 적용
   */
  private applyChanges(content: string, changes: CodeChange[]): string {
    let newContent = content

    for (const change of changes) {
      if (change.oldCode) {
        // 기존 코드 교체
        newContent = newContent.replace(change.oldCode, change.newCode)
      } else {
        // 새 코드 추가 (파일 끝에)
        newContent += '\n\n' + change.newCode
      }
    }

    return newContent
  }

  /**
   * Dry-run: 실제 수정 없이 결과만 미리보기
   */
  async previewFix(analysis: AnalysisResult): Promise<FixResult> {
    console.log('👀 수정 사항 미리보기...')
    
    const fixes: CodeFix[] = []
    
    for (const failureAnalysis of analysis.failures) {
      const fix = await this.generateFix(failureAnalysis)
      fixes.push(fix)
    }

    return {
      timestamp: new Date().toISOString(),
      fixes,
      success: true,
      message: '미리보기 완료 (실제 수정되지 않음)'
    }
  }
}

