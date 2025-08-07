import { EventSubscribe } from '../src/index'
test('eventSubscribe.offDestroy(key) test', () => {
  interface __eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<__eventNameToResultMap>()
  const result: string[] = []
  const dKey = eventSubscribe.onDestroy(() => {
    result.push('destroy')
  })
  eventSubscribe.offDestroy(dKey)
  eventSubscribe.destroy()
  expect(result).toEqual([])
})

test('eventSubscribe.offDestroy(fn) test', () => {
  interface __eventNameToResultMap {
    hello: number
    world: string
  }
  const eventSubscribe = new EventSubscribe<__eventNameToResultMap>()
  const result: string[] = []
  const dFn = () => {
    result.push('destory')
  }
  eventSubscribe.onDestroy(dFn)
  eventSubscribe.offDestroy(dFn)
  eventSubscribe.destroy()
  expect(result).toEqual([])
})
