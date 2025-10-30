/**
 * @intent <작성할 테스트 목적 요약>
 * @risk-level <low|medium|high>
 * 참고: src/__tests__ 스타일과 동일하게 describe/it 구조를 유지하고 본문은 RED 상태를 유지한다.
 */

import { <targetFn> } from '<상대 경로 또는 alias>'

describe('<모듈 또는 기능>', () => {
  describe('<세부 시나리오 그룹>', () => {
    it('<행복 경로 시나리오>', () => {
      void <targetFn>
      throw new Error('Not implemented')
    })

    it('<엣지 케이스 시나리오>', () => {
      void <targetFn>
      throw new Error('Not implemented')
    })
  })
})
