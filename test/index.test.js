const { eventSubscribe } = require('../')

test('eventSubscribe.on(fn) test', () => {
  eventSubscribe.reset()
  const result = []
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

test('eventSubscribe.on(fn, immediate) test', () => {
  eventSubscribe.reset()
  const result = []
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

test('eventSubscribe.replay(name) test', () => {
  eventSubscribe.reset()
  const result = []
  eventSubscribe.trigger('hello', '01')
  eventSubscribe.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })
  eventSubscribe.replay('hello')
  expect(result).toEqual(['a-01'])
})
