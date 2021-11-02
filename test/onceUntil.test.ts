import { EventSubscribe } from '../output'
test('eventSubscribe.onceUntil() test', () => {
  const eventSubscribe = new EventSubscribe()
  eventSubscribe.reset()
  const result: string[] = []
  let padding = 0
  const key = eventSubscribe.onceUntil('hello', (ctx) => {
    result.push(`a-${ctx}`)
    padding++
    return padding < 2
  })

  eventSubscribe.trigger('hello', '01')
  eventSubscribe.trigger('hello', '02')
  eventSubscribe.trigger('hello', '03')
  eventSubscribe.trigger('hello', '04')
  expect(result).toEqual(['a-01', 'a-02'])
})
