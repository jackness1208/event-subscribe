import { EventSubscribe } from '../src/index'
test('eventSubscribe.off() test', () => {
  const iBridge = new EventSubscribe({
    logger: (...args) => {
      // console.log(...args)
    }
  })
  iBridge.reset()
  const result: string[] = []
  const key = iBridge.on('hello', (ctx) => {
    result.push(`a-${ctx}`)
  })

  iBridge.trigger('hello', '01')
  iBridge.off('hello', key)
  iBridge.trigger('hello', '02')
  expect(result).toEqual(['a-01'])
})
