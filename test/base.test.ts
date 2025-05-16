import { EventSubscribe } from '../src/index'

test('eventSubscribe types & addFilter test', async () => {
  interface EsResult {
    one: number
    two: string
    three: number
  }

  interface EsFilter {
    one: string
    two: number
    three: boolean
  }
  type EsKey = keyof EsResult
  const es = new EventSubscribe<EsResult, EsFilter>()
  es.addFilter('one', async (rs) => {
    return 'hello world'
  })

  es.addFilter('two', async (rs) => {
    return rs + 1
  })

  es.addFilter('three', async (rs) => {
    return !!rs
  })

  const r: string[] = []
  es.on('one', (rs) => {
    r.push(rs)
  })

  es.on('two', (rs) => {
    r.push(`${rs}`)
  })

  es.on('three', (rs) => {
    r.push(`${rs}`)
  })

  es.trigger('one', 1)
  es.trigger('two', '1')
  es.trigger('three', 1)

  await 1
  expect(r).toEqual(['hello world', '11', 'true'])
})
