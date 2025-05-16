import { EventSubscribe } from '../src/index'
test('eventSubscribe.trigger() ignoreUndefined', () => {
  const eventSubscribe = new EventSubscribe()
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.on('hello', (txt: string) => {
    result.push(txt)
  })

  eventSubscribe.trigger('hello', undefined, true)
  expect(result).toEqual([])
  eventSubscribe.trigger('hello', '01', true)
  expect(result).toEqual(['01'])
})
