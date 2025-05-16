import { EventSubscribe } from '../src/index'
test('eventSubscribe.offEach(key) test', () => {
  interface EventResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<EventResultMap>()
  const result: string[] = []
  const key01 = eventSubscribe.onEach((type, data) => {
    result.push(`${type}-${data}-01`)
  })
  const key02 = eventSubscribe.onEach((type, data) => {
    result.push(`${type}-${data}-02`)
  })
  eventSubscribe.offEach(key01)
  eventSubscribe.trigger('hello', 1)
  eventSubscribe.trigger('world', '2')

  expect(result).toEqual(['hello-1-02', 'world-2-02'])
})

test('eventSubscribe.offEach(fn) test', () => {
  interface EventResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<EventResultMap>()
  const result: string[] = []
  const fn01 = (type: string, data: any) => {
    result.push(`${type}-${data}-01`)
  }
  const fn02 = (type: string, data: any) => {
    result.push(`${type}-${data}-02`)
  }
  eventSubscribe.onEach(fn01)
  eventSubscribe.onEach(fn02)
  eventSubscribe.offEach(fn01)
  eventSubscribe.trigger('hello', 1)
  eventSubscribe.trigger('world', '2')

  expect(result).toEqual(['hello-1-02', 'world-2-02'])
})
