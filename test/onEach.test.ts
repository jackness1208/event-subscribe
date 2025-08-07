import { EventSubscribe } from '../src/index'
test('eventSubscribe.onEach(fn) test', () => {
  interface eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<eventNameToResultMap>()
  const result: string[] = []
  eventSubscribe.onEach((type, data) => {
    result.push(`${type}-${data}`)
  })
  eventSubscribe.trigger('hello', 1)
  eventSubscribe.trigger('world', '2')
  expect(result).toEqual(['hello-1', 'world-2'])
})

test('eventSubscribe.onEach(fn, immediate) test', () => {
  interface eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<eventNameToResultMap>()
  const result: string[] = []
  eventSubscribe.trigger('hello', 1)
  eventSubscribe.trigger('world', '2')
  eventSubscribe.trigger('hello', 2)
  eventSubscribe.onEach((type, data) => {
    result.push(`${type}-${data}`)
  }, true)
  expect(result).toEqual(['world-2', 'hello-2'])
})
