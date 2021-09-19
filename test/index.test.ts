import { eventSubscribe } from '../output'

test('eventSubscribe.on(name, fn) test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.on('hello', () => {
    result.push('a')
  })
  eventSubscribe.on('hello', () => {
    result.push('b')
  })
  eventSubscribe.on('hello', () => {
    result.push('c')
  })

  eventSubscribe.trigger('hello', undefined)
  expect(result).toEqual(['a', 'b', 'c'])
})

test('eventSubscribe.on(name, fn, immediate) test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.trigger('hello', '01')

  eventSubscribe.on(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )

  eventSubscribe.on('hello', (ctx) => {
    result.push(`b-${ctx}`)
  })

  eventSubscribe.on('hello', (ctx) => {
    result.push(`c-${ctx}`)
  })

  eventSubscribe.trigger('hello', '02')

  expect(result).toEqual(['a-01', 'a-02', 'b-02', 'c-02'])
})

test('eventSubscribe.on(name, fn, immediate, key) test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  const eventKey = 'hellocheck'
  eventSubscribe.on(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    false,
    eventKey
  )

  eventSubscribe.on(
    'hello',
    (ctx) => {
      result.push(`b-${ctx}`)
    },
    false,
    eventKey
  )

  eventSubscribe.trigger('hello', '01')
  eventSubscribe.off('hello', eventKey)
  eventSubscribe.trigger('hello', '02')
  expect(result).toEqual(['b-01'])
})

test('eventSubscribe.replay(name) test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  eventSubscribe.trigger('hello', '01')
  eventSubscribe.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })
  eventSubscribe.replay('hello')
  expect(result).toEqual(['a-01'])
})

test('eventSubscribe.off() test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  const key = eventSubscribe.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })

  eventSubscribe.trigger('hello', '01')
  eventSubscribe.off('hello', key)
  eventSubscribe.trigger('hello', '02')
  expect(result).toEqual(['a-01'])
})

test('eventSubscribe.once() test', () => {
  eventSubscribe.reset()
  const result: string[] = []
  const key = eventSubscribe.once('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })

  eventSubscribe.trigger('hello', '01')
  eventSubscribe.trigger('hello', '02')
  expect(result).toEqual(['a-01'])
})

test('eventSubscribe.onceUntil() test', () => {
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