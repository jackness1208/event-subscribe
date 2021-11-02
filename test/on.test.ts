import { EventSubscribe } from '../output'
test('eventSubscribe.on(name, fn) test', () => {
  const eventSubscribe = new EventSubscribe()
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
  const eventSubscribe = new EventSubscribe()
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

test('eventSubscribe.on(name, fn, immediate) once & on', () => {
  const eventSubscribe = new EventSubscribe()
  const result: string[] = []

  eventSubscribe.once(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )

  eventSubscribe.on(
    'hello',
    (ctx) => {
      result.push(`b-${ctx}`)
    },
    true
  )
  eventSubscribe.trigger('hello', '01')

  expect(result).toEqual(['a-01', 'b-01'])
})

test('eventSubscribe.on(name, fn, immediate) test argv = undefined', () => {
  const eventSubscribe = new EventSubscribe()
  const result: string[] = []
  eventSubscribe.trigger('hello', undefined)

  eventSubscribe.on(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )

  expect(result).toEqual(['a-undefined'])
})

test('eventSubscribe.on(name, fn, immediate, key) test', () => {
  const eventSubscribe = new EventSubscribe()
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
