/**
 * 동적 폴더 관리 유틸리티
 * 
 * 테스트 실행 시 필요한 폴더와 파일을 자동으로 생성합니다.
 */

import fs from 'fs/promises'
import path from 'path'

export interface FolderStructure {
  path: string
  files?: FileTemplate[]
  subdirs?: FolderStructure[]
}

export interface FileTemplate {
  name: string
  content: string
}

/**
 * 폴더 관리자 클래스
 */
export class FolderManager {
  private baseDir: string

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir
  }

  /**
   * 리포트 폴더 생성
   * 패턴: infra/reports/{role}/{timestamp}/
   */
  async createReportFolder(role: string, timestamp: string = new Date().toISOString()): Promise<string> {
    // 타임스탬프를 파일명에 적합한 형식으로 변환
    const dateStr = this.formatTimestamp(timestamp)
    
    const reportDir = path.join(
      this.baseDir,
      'infra',
      'reports',
      role,
      dateStr
    )

    // 폴더 생성
    await this.ensureDirectory(reportDir)

    console.log(`📁 리포트 폴더 생성: ${reportDir}`)

    // 기본 파일 생성
    await this.createPlaceholderFiles(reportDir)

    return reportDir
  }

  /**
   * 플레이스홀더 파일 생성
   */
  private async createPlaceholderFiles(reportDir: string): Promise<void> {
    const files: FileTemplate[] = [
      {
        name: 'result.json',
        content: JSON.stringify([], null, 2)
      },
      {
        name: 'summary.md',
        content: '# 테스트 요약\n\n리포트 생성 중...\n'
      },
      {
        name: 'evaluation.md',
        content: '# 평가\n\n분석 중...\n'
      }
    ]

    for (const file of files) {
      const filePath = path.join(reportDir, file.name)
      await fs.writeFile(filePath, file.content)
    }
  }

  /**
   * Overview 폴더 생성
   */
  async createOverviewFolder(): Promise<string> {
    const overviewDir = path.join(this.baseDir, 'infra', 'overview')
    
    await this.ensureDirectory(overviewDir)

    // tdd-session-summary.md 초기화 (존재하지 않으면)
    const summaryPath = path.join(overviewDir, 'tdd-session-summary.md')
    
    try {
      await fs.access(summaryPath)
    } catch {
      // 파일이 없으면 생성
      await fs.writeFile(
        summaryPath,
        `# TDD 세션 요약\n\n이 파일은 모든 TDD 세션의 요약을 기록합니다.\n\n---\n\n`
      )
      console.log(`📄 세션 요약 파일 생성: ${summaryPath}`)
    }

    return overviewDir
  }

  /**
   * 필수 디렉토리 구조 초기화
   */
  async initializeStructure(): Promise<void> {
    console.log('📁 필수 디렉토리 구조 초기화 중...')

    const structure: FolderStructure = {
      path: 'infra',
      subdirs: [
        {
          path: 'reports',
          subdirs: [
            { path: 'test-writer' },
            { path: 'impl-generator' },
            { path: 'test-runner' },
            { path: 'tdd-agent' }
          ]
        },
        {
          path: 'overview'
        },
        {
          path: 'tmp',
          subdirs: [
            { path: 'backups' }
          ],
          files: [
            {
              name: 'cache.json',
              content: JSON.stringify({
                lastRun: null,
                testResults: [],
                sessions: []
              }, null, 2)
            }
          ]
        },
        {
          path: 'generated-tests',
          subdirs: [
            { 
              path: 'unit',
              subdirs: [
                { path: 'test-writer' },
                { path: 'impl-writer' }
              ]
            },
            { 
              path: 'hooks',
              subdirs: [
                { path: 'test-writer' },
                { path: 'impl-writer' }
              ]
            },
            { 
              path: 'integration',
              subdirs: [
                { path: 'test-writer' },
                { path: 'impl-writer' }
              ]
            }
          ]
        }
      ]
    }

    await this.createStructure(structure)

    console.log('✅ 디렉토리 구조 초기화 완료')
  }

  /**
   * 재귀적으로 폴더 구조 생성
   */
  private async createStructure(structure: FolderStructure): Promise<void> {
    const fullPath = path.join(this.baseDir, structure.path)
    
    // 디렉토리 생성
    await this.ensureDirectory(fullPath)

    // 파일 생성
    if (structure.files) {
      for (const file of structure.files) {
        const filePath = path.join(fullPath, file.name)
        
        // 파일이 이미 존재하면 건너뛰기
        try {
          await fs.access(filePath)
          console.log(`  ⏭️  파일 존재함 (건너뜀): ${filePath}`)
        } catch {
          await fs.writeFile(filePath, file.content)
          console.log(`  ✅ 파일 생성: ${filePath}`)
        }
      }
    }

    // 서브 디렉토리 재귀 생성
    if (structure.subdirs) {
      for (const subdir of structure.subdirs) {
        await this.createStructure({
          ...subdir,
          path: path.join(structure.path, subdir.path)
        })
      }
    }
  }

  /**
   * 디렉토리 생성 (존재하지 않으면)
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * 타임스탬프를 파일명 형식으로 변환
   * 예: 2025-10-29T10:30:45.123Z -> 2025-10-29_10-30-45
   */
  private formatTimestamp(timestamp: string): string {
    return timestamp
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5) // 밀리초 제거
  }

  /**
   * 오래된 리포트 정리
   */
  async cleanOldReports(days: number = 30): Promise<number> {
    console.log(`🧹 ${days}일 이상 된 리포트 정리 중...`)

    const reportsDir = path.join(this.baseDir, 'infra', 'reports')
    let deletedCount = 0

    try {
      const roles = await fs.readdir(reportsDir)

      for (const role of roles) {
        const rolePath = path.join(reportsDir, role)
        const stat = await fs.stat(rolePath)

        if (!stat.isDirectory()) continue

        const timestamps = await fs.readdir(rolePath)

        for (const timestamp of timestamps) {
          // latest.md는 건너뛰기
          if (timestamp === 'latest.md') continue

          const timestampPath = path.join(rolePath, timestamp)
          const timestampStat = await fs.stat(timestampPath)

          if (!timestampStat.isDirectory()) continue

          // 생성 시간 확인
          const ageInDays = (Date.now() - timestampStat.mtimeMs) / (1000 * 60 * 60 * 24)

          if (ageInDays > days) {
            await fs.rm(timestampPath, { recursive: true, force: true })
            deletedCount++
            console.log(`  🗑️  삭제: ${timestampPath}`)
          }
        }
      }

      console.log(`✅ 총 ${deletedCount}개 리포트 삭제 완료`)
    } catch (error) {
      console.error('❌ 리포트 정리 중 에러:', error)
    }

    return deletedCount
  }

  /**
   * 백업 디렉토리 정리
   */
  async cleanBackups(maxBackups: number = 10): Promise<void> {
    console.log(`🧹 백업 정리 중 (최대 ${maxBackups}개 유지)...`)

    const backupDir = path.join(this.baseDir, 'infra', 'tmp', 'backups')

    try {
      const files = await fs.readdir(backupDir)
      
      // 파일 정보 수집
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(backupDir, file)
          const stat = await fs.stat(filePath)
          return { file, mtime: stat.mtimeMs }
        })
      )

      // 최신 순으로 정렬
      fileStats.sort((a, b) => b.mtime - a.mtime)

      // 오래된 백업 삭제
      const toDelete = fileStats.slice(maxBackups)

      for (const { file } of toDelete) {
        const filePath = path.join(backupDir, file)
        await fs.unlink(filePath)
        console.log(`  🗑️  백업 삭제: ${file}`)
      }

      console.log(`✅ 백업 정리 완료 (${fileStats.length - toDelete.length}개 유지)`)
    } catch (error) {
      console.error('❌ 백업 정리 중 에러:', error)
    }
  }

  /**
   * 디스크 사용량 확인
   */
  async getDiskUsage(): Promise<{ reports: number; tmp: number; total: number }> {
    const getDirectorySize = async (dirPath: string): Promise<number> => {
      let size = 0

      try {
        const files = await fs.readdir(dirPath, { withFileTypes: true })

        for (const file of files) {
          const filePath = path.join(dirPath, file.name)

          if (file.isDirectory()) {
            size += await getDirectorySize(filePath)
          } else {
            const stat = await fs.stat(filePath)
            size += stat.size
          }
        }
      } catch {
        // 디렉토리 접근 불가 시 무시
      }

      return size
    }

    const reportsSize = await getDirectorySize(path.join(this.baseDir, 'infra', 'reports'))
    const tmpSize = await getDirectorySize(path.join(this.baseDir, 'infra', 'tmp'))

    return {
      reports: reportsSize,
      tmp: tmpSize,
      total: reportsSize + tmpSize
    }
  }

  /**
   * 사용량을 읽기 쉬운 형식으로 변환
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}

/**
 * 싱글톤 인스턴스
 */
let folderManagerInstance: FolderManager | null = null

/**
 * FolderManager 인스턴스 가져오기
 */
export function getFolderManager(baseDir?: string): FolderManager {
  if (!folderManagerInstance) {
    folderManagerInstance = new FolderManager(baseDir)
  }
  return folderManagerInstance
}

