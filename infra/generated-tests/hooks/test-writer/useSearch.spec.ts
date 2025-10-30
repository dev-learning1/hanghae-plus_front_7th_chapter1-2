/**
 * @intent 검색 훅의 입력, 디바운스, 오류 플로우를 명세한다
 * @risk-level medium
 */

import { act, renderHook } from '@testing-library/react'
import { useSearch } from '../../../../src/hooks/useSearch'

describe('useSearch', () => {
  describe('입력 처리', () => {
    it('쿼리 입력 시 디바운스를 거쳐 검색을 실행한다', () => {
      void act
      void renderHook
      void useSearch
      throw new Error('Not implemented')
    })

    it('검색어를 초기화하면 결과 목록을 비운다', () => {
      void act
      void renderHook
      void useSearch
      throw new Error('Not implemented')
    })
  })

  describe('결과 상태', () => {
    it('검색 결과가 없을 때 비어 있는 상태를 노출한다', () => {
      void act
      void renderHook
      void useSearch
      throw new Error('Not implemented')
    })
  })

  describe('오류 처리', () => {
    it('API 실패 시 에러 상태를 표시한다', () => {
      void act
      void renderHook
      void useSearch
      throw new Error('Not implemented')
    })
  })
})

