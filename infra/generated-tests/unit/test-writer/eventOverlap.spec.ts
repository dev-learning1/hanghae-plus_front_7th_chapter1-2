/**
 * @intent 이벤트 중첩 유틸리티 각 함수의 Happy/Edge/Error 시나리오를 명세한다
 * @risk-level high
 */

import { convertEventToDateRange, findOverlappingEvents, isOverlapping, parseDateTime } from '../../../../src/utils/eventOverlap'

describe('parseDateTime', () => {
  it('날짜와 시간을 합쳐 Date 객체를 만든다', () => {
    void parseDateTime
    throw new Error('Not implemented')
  })

  it('잘못된 시간 문자열이면 예외를 발생시킨다', () => {
    void parseDateTime
    throw new Error('Not implemented')
  })
})

describe('convertEventToDateRange', () => {
  it('이벤트를 시작/종료 Date 범위로 변환한다', () => {
    void convertEventToDateRange
    throw new Error('Not implemented')
  })

  it('이벤트 폼 입력도 동일하게 변환한다', () => {
    void convertEventToDateRange
    throw new Error('Not implemented')
  })
})

describe('isOverlapping', () => {
  it('겹치는 시간이 있으면 true를 반환한다', () => {
    void isOverlapping
    throw new Error('Not implemented')
  })

  it('끝나는 시각과 시작 시각이 동일하면 겹치지 않는다', () => {
    void isOverlapping
    throw new Error('Not implemented')
  })

  it('하루 이상 지속되는 이벤트 겹침을 감지한다', () => {
    void isOverlapping
    throw new Error('Not implemented')
  })
})

describe('findOverlappingEvents', () => {
  it('기존 이벤트 중 겹치는 항목을 반환한다', () => {
    void findOverlappingEvents
    throw new Error('Not implemented')
  })

  it('새 이벤트와 동일한 id는 제외한다', () => {
    void findOverlappingEvents
    throw new Error('Not implemented')
  })

  it('겹치는 이벤트가 없으면 빈 배열을 반환한다', () => {
    void findOverlappingEvents
    throw new Error('Not implemented')
  })
})

