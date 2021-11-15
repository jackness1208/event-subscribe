import { EventSubscribe } from '../output'
test('eventSubscribe.onDestroy(fn) test', () => {
  interface EventResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<EventResultMap>()
  const result: string[] = []
  eventSubscribe.onDestroy(() => {
    result.push('destroy')
  })
  eventSubscribe.destroy()
  expect(result).toEqual(['destroy'])
})
