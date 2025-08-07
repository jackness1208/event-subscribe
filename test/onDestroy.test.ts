import { EventSubscribe } from '../src/index'
test('eventSubscribe.onDestroy(fn) test', () => {
  interface eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<eventNameToResultMap>()
  const result: string[] = []
  eventSubscribe.onDestroy(() => {
    result.push('destroy')
  })
  eventSubscribe.destroy()
  expect(result).toEqual(['destroy'])
})
