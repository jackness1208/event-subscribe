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
      // console.log(...args)
    }
  })

  // global
  const globalDataArr: string[] = []
  eventBridge.onGlobal('one', (data) => {
    globalDataArr.push(data)
  })
  eventBridge.onGlobal('two', (data) => {
    globalDataArr.push(data)
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
  expect(globalDataArr).toEqual(['1', '2'])

  // page 2
  curPrefixKey = 'page2'
  const page2DataArr: string[] = []
  eventBridge.on(
    'one',
    (data) => {
      page2DataArr.push(data)
    },
    true
  )

  eventBridge.on(
    'two',
    (data) => {
      page2DataArr.push(data)
    },
    true
  )

  eventBridge.trigger('one', '3')
  eventBridge.trigger('two', '4')
  expect(page1DataArr).toEqual(['1', '2', '3', '4'])
  expect(page2DataArr).toEqual(['1', '2', '3', '4'])
  expect(globalDataArr).toEqual(['1', '2', '3', '4'])

  eventBridge.destroy()

  eventBridge.trigger('one', '5')
  eventBridge.trigger('two', '6')

  expect(page1DataArr).toEqual(['1', '2', '3', '4', '5', '6'])
  expect(page2DataArr).toEqual(['1', '2', '3', '4'])
  expect(globalDataArr).toEqual(['1', '2', '3', '4', '5', '6'])

  curPrefixKey = 'page1'
  eventBridge.destroy()

  eventBridge.trigger('one', '7')
  eventBridge.trigger('two', '8')

  expect(page1DataArr).toEqual(['1', '2', '3', '4', '5', '6'])
  expect(page2DataArr).toEqual(['1', '2', '3', '4'])
  expect(globalDataArr).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])

  eventBridge.destroy({ ignorePrefix: true })

  eventBridge.trigger('one', '9')
  eventBridge.trigger('two', '10')

  expect(globalDataArr).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
})
