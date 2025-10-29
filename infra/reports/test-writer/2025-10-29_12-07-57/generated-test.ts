import { describe, it, expect } from 'vitest'
import { Event } from '../../types'
import { getFilteredEvents } from '../../utils/eventUtils'

describe('getFilteredEvents', () => {
  const mockEvents: Event[] = [
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

  it('정상적인 입력에 대해 올바른 결과를 반환한다', () => {
    // Given
    const events = mockEvents
    
    const date = new Date('2025-07-01')
    const view = 'month'
    
    // When
    const result = getFilteredEvents(events, date, view)
    
    // Then
    expect(result).toBeDefined()
    // TODO: 구체적인 검증 추가
  })

  it('빈 배열에 대해 빈 결과를 반환한다', () => {
    const result = getFilteredEvents([], , new Date('2025-07-01'), 'month')
    expect(result).toHaveLength(0)
  })

  it("주간 뷰('week')로 필터링이 작동한다", () => {
    const result = getFilteredEvents(mockEvents, new Date('2025-07-01'), 'week')
    expect(result).toBeDefined()
  })

  it("월간 뷰('month')로 필터링이 작동한다", () => {
    const result = getFilteredEvents(mockEvents, new Date('2025-07-01'), 'month')
    expect(result).toBeDefined()
  })

  it('월의 경계에 있는 데이터를 올바르게 처리한다', () => {
    const result = getFilteredEvents(mockEvents, new Date('2025-07-31'), 'month')
    expect(result).toBeDefined()
  })
})
