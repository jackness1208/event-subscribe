import { EventSubscribe } from '../output'
test('eventSubscribe.onWithPreserve()', () => {
  const result: string[] = []
  interface BridgeMap {
    log: string
  }
  const iBridge = new EventSubscribe<BridgeMap>({
    eventWithPreserve: ['log']
  })

  iBridge.trigger('log', 'hello 01')
  iBridge.trigger('log', 'hello 02')
  iBridge.trigger('log', 'hello 03')
  iBridge.onWithPreserve('log', (str) => {
    result.push(str)
  })
  iBridge.trigger('log', 'hello 04')
  expect(result).toEqual(['hello 01', 'hello 02', 'hello 03', 'hello 04'])
})

test('eventSubscribe.onWithPreserve() with logger', () => {
  const result: string[] = []
  interface BridgeMap {
    log: string
  }
  const iBridge = new EventSubscribe<BridgeMap>({
    eventWithPreserve: ['log'],
    logger: (type, name, args) => {
      if (type === 'trigger') {
        iBridge.trigger('log', args[0])
      }
    }
  })

  iBridge.trigger('log', 'hello 01')
  iBridge.trigger('log', 'hello 02')
  iBridge.trigger('log', 'hello 03')
  iBridge.onWithPreserve('log', (str) => {
    result.push(str)
  })
  iBridge.trigger('log', 'hello 04')
  expect(result).toEqual(['hello 01', 'hello 02', 'hello 03', 'hello 04'])
})
