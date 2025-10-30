/**
 * @intent useNotifications 훅의 상태 흐름을 명세한다
 * @risk-level high
 */
import { describe, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from '../../../../src/hooks/useNotifications'

describe('useNotifications', () => {
  it('기본 상태를 제공한다', () => {
    renderHook(() => useNotifications())
    throw new Error('Not implemented')
  })

  it('상태 전이를 처리한다', () => {
    const { result } = renderHook(() => useNotifications())
    act(() => {
      // TODO: 상태 전이 액션 수행
    })
    throw new Error('Not implemented')
  })
})
