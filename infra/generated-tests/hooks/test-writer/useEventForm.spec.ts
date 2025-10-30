/**
 * @intent useEventForm 훅의 상태 흐름을 명세한다
 * @risk-level high
 */
import { describe, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEventForm } from '../../../../src/hooks/useEventForm'

describe('useEventForm', () => {
  it('기본 상태를 제공한다', () => {
    renderHook(() => useEventForm())
    throw new Error('Not implemented')
  })

  it('상태 전이를 처리한다', () => {
    const { result } = renderHook(() => useEventForm())
    act(() => {
      // TODO: 상태 전이 액션 수행
    })
    throw new Error('Not implemented')
  })
})
