/**
 * @intent 시간 검증 유틸리티의 정상·오류 시나리오를 정의한다
 * @risk-level medium
 */

import { getTimeErrorMessage } from '../../../../src/utils/timeValidation'

describe('getTimeErrorMessage', () => {
  it('시작 시간이 종료 시간보다 늦으면 오류 메시지를 반환한다', () => {
    void getTimeErrorMessage
    throw new Error('Not implemented')
  })

  it('동일하거나 유효한 시간 조합이면 오류가 없다', () => {
    void getTimeErrorMessage
    throw new Error('Not implemented')
  })

  it('입력이 비어 있으면 null 오류를 반환한다', () => {
    void getTimeErrorMessage
    throw new Error('Not implemented')
  })
})

