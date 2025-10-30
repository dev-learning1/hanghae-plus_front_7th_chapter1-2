/**
 * @intent 이벤트 폼 훅의 초기 상태, 필드 업데이트, 제출 흐름을 명세한다
 * @risk-level high
 */

import { act, renderHook } from '@testing-library/react'
import { useEventForm } from '../../../../src/hooks/useEventForm'

describe('useEventForm', () => {
  describe('초기 상태', () => {
    it('기본 필드 값과 검증 플래그를 제공한다', () => {
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })
  })

  describe('필드 업데이트', () => {
    it('제목 입력을 업데이트하면 상태에 반영된다', () => {
      void act
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })

    it('반복 옵션을 weekly로 변경하면 관련 설정이 활성화된다', () => {
      void act
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })
  })

  describe('검증', () => {
    it('필수 필드가 비어 있으면 submit을 차단한다', () => {
      void act
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })
  })

  describe('제출', () => {
    it('성공 시 콜백과 리셋을 호출한다', () => {
      void act
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })

    it('API 실패 시 오류 상태를 노출한다', () => {
      void act
      void renderHook
      void useEventForm
      throw new Error('Not implemented')
    })
  })
})

