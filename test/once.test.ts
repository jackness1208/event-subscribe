import { EventSubscribe } from '../output'
test('eventSubscribe.once() immediate test', () => {
  const eventSubscribe = new EventSubscribe()
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.trigger('hello', '01')
  const key = eventSubscribe.once(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )

  eventSubscribe.trigger('hello', '02')
  expect(result).toEqual(['a-01'])
})

test('eventSubscribe.once() immediate 2 test', () => {
  const eventSubscribe = new EventSubscribe()
  eventSubscribe.reset()
  const result: string[] = []
  const key = eventSubscribe.once(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )
  eventSubscribe.trigger('hello', '01')

  eventSubscribe.trigger('hello', '02')
  expect(result).toEqual(['a-01'])
})
