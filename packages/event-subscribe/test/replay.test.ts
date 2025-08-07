import { EventSubscribe } from '../src/index'
test('eventSubscribe.replay(name) test', () => {
  const eventSubscribe = new EventSubscribe()
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.trigger('hello', '01')
  eventSubscribe.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })
  eventSubscribe.replay('hello')
  expect(result).toEqual(['a-01'])
})
