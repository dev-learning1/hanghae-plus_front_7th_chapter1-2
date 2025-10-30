/**
 * @intent 알림 유틸리티 함수별 동작과 경계 조건을 명세한다
 * @risk-level medium
 */

import { createNotificationMessage, getUpcomingEvents } from '../../../../src/utils/notificationUtils'

describe('getUpcomingEvents', () => {
  it('현재 시각 기준 알림 시간이 임박한 이벤트를 반환한다', () => {
    void getUpcomingEvents
    throw new Error('Not implemented')
  })

  it('이미 알림된 이벤트는 제외한다', () => {
    void getUpcomingEvents
    throw new Error('Not implemented')
  })

  it('알림 시간이 지난 이벤트는 반환하지 않는다', () => {
    void getUpcomingEvents
    throw new Error('Not implemented')
  })
})

describe('createNotificationMessage', () => {
  it('알림 문구에 시간과 제목을 포함한다', () => {
    void createNotificationMessage
    throw new Error('Not implemented')
  })

  it('notificationTime이 누락되면 예외를 던진다', () => {
    void createNotificationMessage
    throw new Error('Not implemented')
  })
})

