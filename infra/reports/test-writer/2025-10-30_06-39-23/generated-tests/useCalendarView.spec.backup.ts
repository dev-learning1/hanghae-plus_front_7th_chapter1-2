import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCalendarView } from '../../hooks/useCalendarView'

describe('초기 상태', () => {
  it('훅이 올바르게 초기화된다', () => {
    const { result } = renderHook(() => useCalendarView())

    expect(result.current).toBeDefined()
    // TODO: 초기 상태 검증
  })
})

it('상태 변경이 올바르게 동작한다', () => {
  const { result } = renderHook(() => useCalendarView())

  act(() => {
    // TODO: 액션 호출
  })

  // TODO: 변경된 상태 검증
  expect(true).toBe(true)
})
