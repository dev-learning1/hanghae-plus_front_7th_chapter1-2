/**
 * @intent useSearch 훅의 상태 흐름을 명세한다
 * @risk-level high
 */
import { describe, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from '../../../../src/hooks/useSearch'

describe('useSearch', () => {
  it('기본 상태를 제공한다', () => {
    renderHook(() => useSearch())
    throw new Error('Not implemented')
  })

  it('상태 전이를 처리한다', () => {
    const { result } = renderHook(() => useSearch())
    act(() => {
      // TODO: 상태 전이 액션 수행
    })
    throw new Error('Not implemented')
  })
})
