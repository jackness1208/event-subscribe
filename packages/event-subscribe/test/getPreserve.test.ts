import { EventSubscribe } from '../src/index'
test('eventSubscribe.getPreserve()', () => {
  interface BridgeMap {
    log: string
  }
  const iBridge = new EventSubscribe<BridgeMap>({
    // logger: (...args) => {
    //   console.log(...args)
    // },
    __eventWithPreserve: ['log']
  })

  iBridge.trigger('log', 'hello 01')
  iBridge.trigger('log', 'hello 02')
  iBridge.trigger('log', 'hello 03')
  iBridge.trigger('log', 'hello 04')
  expect(iBridge.getPreserve('log')).toEqual(['hello 01', 'hello 02', 'hello 03', 'hello 04'])
})
