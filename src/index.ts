/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}

export interface EventFnMap {
  [eventName: string]: ((rs: any) => void)[]
}

let eventResultMap: EventResultMap = {}
let eventFnMap: EventFnMap = {}

export const eventBridge = {
  /**
   * 事件订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * */
  on<R = any>(name: string, callback: (rs: R) => void, immediate?: boolean) {
    if (name in eventFnMap) {
      eventFnMap[name].push(callback)
    } else {
      eventFnMap[name] = [callback]
    }
    if (immediate && name in eventResultMap) {
      callback(eventResultMap[name])
    }
  },
  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  trigger<R = any>(name: string, data: R) {
    if (name in eventFnMap) {
      eventFnMap[name].forEach((fn) => {
        fn(data)
      })
    }
    eventResultMap[name] = data
  },
  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay(name: string) {
    if (name in eventFnMap && name in eventResultMap) {
      const lastResult = eventResultMap[name]
      eventFnMap[name].forEach((fn) => {
        fn(lastResult)
      })
    }
  },

  /** reset 清空已绑定的事件 */
  reset() {
    eventResultMap = {}
    eventFnMap = {}
  }
}
