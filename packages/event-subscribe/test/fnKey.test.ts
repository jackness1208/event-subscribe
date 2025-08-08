import { EventSubscribe } from '../src/index'

interface EventMap {
  one: string
  two: string
}

test('eventSubscribe on fnKey 功能测试', () => {
  const eventBridge = new EventSubscribe<EventMap>({
    logger: (...args) => {
      // console.log(...args)
    }
  })
  const dataOneArr: string[] = []
  const dataTwoArr: string[] = []
  eventBridge.on(
    'one',
    (data) => {
      dataOneArr.push(data)
    },
    true,
    'arranger'
  )

  eventBridge.on(
    'two',
    (data) => {
      dataTwoArr.push(data)
    },
    true,
    'arranger'
  )

  eventBridge.trigger('one', '1')
  eventBridge.trigger('two', '2')
  expect(dataOneArr).toEqual(['1'])
  expect(dataTwoArr).toEqual(['2'])

  eventBridge.destroy()

  eventBridge.trigger('one', '3')
  eventBridge.trigger('two', '4')

  expect(dataOneArr).toEqual(['1'])
  expect(dataTwoArr).toEqual(['2'])
})
