import { EventSubscribe } from '../src/index'

interface EventMap {
  one: string
  two: string
}
test('eventSubscribe deleteCache 功能测试', () => {
  const eventBridge = new EventSubscribe<EventMap>()

  eventBridge.trigger('one', '1')
  eventBridge.trigger('two', '1')
  eventBridge.deleteCache('one')

  const oneCache = eventBridge.getCache('one')
  const twoCache = eventBridge.getCache('two')

  eventBridge.trigger('one', '2')
  eventBridge.trigger('two', '2')
  eventBridge.deleteCache()

  const lastCache = eventBridge.getCache('two')

  expect(oneCache).toEqual(undefined)
  expect(twoCache).toEqual('1')
  expect(lastCache).toEqual(undefined)
})
