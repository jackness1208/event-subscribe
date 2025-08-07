import { EventSubscribe } from '../src/index'
test('eventSubscribe.onDestroy(fn) test', () => {
  interface __eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<__eventNameToResultMap>()
  const result: string[] = []
  eventSubscribe.onDestroy(() => {
    result.push('destroy')
  })
  eventSubscribe.destroy()
  expect(result).toEqual(['destroy'])
})
