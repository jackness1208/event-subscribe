import { EventSubscribe } from '../src/index'

interface EventMap {
  one: string
  two: string
}

test('eventSubscribe autoEventPrefix 功能测试 & destroy 测试', () => {
  let curPrefixKey = ''
  const eventBridge = new EventSubscribe<EventMap>({
    autoEventPrefix: () => {
      return curPrefixKey
    },
    logger: (...args) => {
      console.log(...args)
    }
  })

  // page 1
  const page1DataArr: string[] = []
  curPrefixKey = 'page1'
  eventBridge.on('one', (data) => {
    page1DataArr.push(data)
  })

  eventBridge.on('two', (data) => {
    page1DataArr.push(data)
  })

  eventBridge.trigger('one', '1')
  eventBridge.trigger('two', '2')
  expect(page1DataArr).toEqual(['1', '2'])

  // page 2
  curPrefixKey = 'page2'
  const page2DataArr: string[] = []
  eventBridge.on('one', (data) => {
    page1DataArr.push(data)
  })

  eventBridge.on('two', (data) => {
    page1DataArr.push(data)
  })

  eventBridge.trigger('one', '1')
  eventBridge.trigger('two', '2')
  expect(page1DataArr).toEqual(['1', '2', '1', '2'])
  expect(page2DataArr).toEqual(['1', '2'])

  eventBridge.destroy()

  eventBridge.trigger('one', '1')
  eventBridge.trigger('two', '2')

  expect(page1DataArr).toEqual(['1', '2', '1', '2', '1', '2'])
  expect(page2DataArr).toEqual(['1', '2'])
})
