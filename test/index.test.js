const { eventBridge } = require('../')

test('eventBridge.on(fn) test', () => {
  eventBridge.reset()
  const result = []
  eventBridge.on('hello', () => {
    result.push('a')
  })
  eventBridge.on('hello', () => {
    result.push('b')
  })
  eventBridge.on('hello', () => {
    result.push('c')
  })

  eventBridge.trigger('hello', undefined)
  expect(result).toEqual(['a', 'b', 'c'])
})

test('eventBridge.on(fn, immediate) test', () => {
  eventBridge.reset()
  const result = []
  eventBridge.trigger('hello', '01')

  eventBridge.on(
    'hello',
    (ctx) => {
      result.push(`a-${ctx}`)
    },
    true
  )

  eventBridge.on('hello', (ctx) => {
    result.push(`b-${ctx}`)
  })

  eventBridge.on('hello', (ctx) => {
    result.push(`c-${ctx}`)
  })

  eventBridge.trigger('hello', '02')

  expect(result).toEqual(['a-01', 'a-02', 'b-02', 'c-02'])
})

test('eventBridge.replay(name) test', () => {
  eventBridge.reset()
  const result = []
  eventBridge.trigger('hello', '01')
  eventBridge.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })
  eventBridge.replay('hello')
  expect(result).toEqual(['a-01'])
})
