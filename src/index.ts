/** 事件 hooks */
export interface EventResultMap {
  [eventName: string | number | symbol]: any
}

/** 事件回调 */
export type EventCallback<R = any> = (rs: R) => void

export interface EventFnMap {
  [eventName: string]: EventCallback[]
}
export class EventSubscribe<
  M extends EventResultMap = EventResultMap,
  K extends keyof M = keyof M
> {
  private eventResultMap: Record<K, M[K]> = {}
  private eventFnMap: EventFnMap = {}

  /**
   * 事件订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   * */
  on<K extends keyof M, R = M[K]>(name: K, callback: EventCallback<R>, fnKey?: string) {
    const { eventFnMap, eventResultMap } = this
    if (name in eventFnMap) {
      eventFnMap[name].push(callback)
    } else {
      eventFnMap[name] = [callback]
    }

    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      eventSubscribe.off(name, fnKey)
    }

    // key 关系初始化
    const eventKey = formatEventKey(name, fnKey)
    eventKeyMap.set(eventKey, callback)

    if (immediate && name in eventResultMap) {
      callback(eventResultMap[name])
    }
    return eventKey
  }
}
