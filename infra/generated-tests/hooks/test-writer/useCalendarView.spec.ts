import { describe, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCalendarView } from '../../../../src/hooks/useCalendarView'

describe('초기 상태', () => {
  it('view는 "month"이어야 한다', () => {
    const { result } = renderHook(() => useCalendarView())
    act(() => {
      // TODO: 상태 전이 작업
    })
    throw new Error('Not implemented')
  })
  it('currentDate는 오늘 날짜인 "2025-10-01"이어야 한다', () => {
    const { result } = renderHook(() => useCalendarView())
    act(() => {
      // TODO: 상태 전이 작업
    })
    throw new Error('Not implemented')
  })
  it('holidays는 10월 휴일인 개천절, 한글날, 추석이 지정되어 있어야 한다', () => {
    const { result } = renderHook(() => useCalendarView())
    act(() => {
      // TODO: 상태 전이 작업
    })
    throw new Error('Not implemented')
  })
})
