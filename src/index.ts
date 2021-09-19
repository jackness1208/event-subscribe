/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}

/** 事件回调 */
export type EventCallback<R = any> = (rs: R) => void
export type EventOnceUntilCallback<R = any> = (rs: R) => boolean | undefined

export interface EventFnMap {
  [eventName: string]: EventCallback[]
}
export class EventSubscribe<
  K extends string,
  M extends Record<K, any>,
  F extends Record<K, any> = M,
  R = F[K]
> {
  private eventResultMap: Partial<Record<K, R>> = {}
  private eventFnMap: Partial<Record<K, EventCallback<R>[]>> = {}
  /** 事件 key map */
  private eventKeyMap: Map<string, EventCallback<R>> = new Map()
  /** 事件key */
  private eventKeyPadding: number = 0

  /** 格式化 事件key */
  private formatEventKey(name: string, fnKey?: string) {
    if (fnKey) {
      return `${fnKey}`
    } else {
      return `${name}-${this.eventKeyPadding++}`
    }
  }

  /**
   * 事件订阅
   * @param name: 事件名称
   * @param done: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   * */
  on(name: K, done: EventCallback<R>, immediate?: boolean, fnKey?: string) {
    const { eventFnMap, eventResultMap, eventKeyMap } = this
    if (eventFnMap[name]) {
      eventFnMap[name]?.push(done)
    } else {
      eventFnMap[name] = [done]
    }

    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.off(name, fnKey)
    }

    // key 关系初始化
    const eventKey = this.formatEventKey(`${name}`, fnKey)
    eventKeyMap.set(eventKey, done)

    if (immediate && name in eventResultMap) {
      done(eventResultMap[name] as R)
    }
    return eventKey
  }

  /**
   * 事件多次性订阅, callback
   * 若返回 true, 则继续定义
   * 若返回 false， 自动取消订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 立刻执行
   * @returns eventKey 订阅标识, 用于 off
   * */
  onceUntil(name: K, callback: EventOnceUntilCallback<R>, immediate?: boolean) {
    const key = this.on(
      name,
      (res) => {
        if (!callback(res)) {
          this.off(name, key)
        }
      },
      immediate,
      this.formatEventKey(`${name}`)
    )
    return key
  }

  /**
   * 事件一次性订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @returns eventKey 订阅标识, 用于 off
   * */
  once(name: K, callback: EventCallback<R>) {
    const key = this.on(
      name,
      (res) => {
        this.off(name, key)
        callback(res)
      },
      false,
      this.formatEventKey(`${name}`)
    )
    return key
  }

  /**
   * 事件退订
   * @param name: 事件名称
   * @param ctx: 订阅时方法 | 订阅标识
   * */
  off(name: K, ctx: EventCallback<R> | string) {
    const { eventFnMap, eventKeyMap } = this
    const eventFns = eventFnMap[name]
    let rFn: EventCallback | undefined
    if (eventFns?.length) {
      if (typeof ctx === 'string') {
        rFn = eventKeyMap.get(ctx)
      } else {
        rFn = ctx
      }

      if (rFn) {
        const rFnIndex = eventFns.indexOf(rFn)

        if (rFnIndex !== -1) {
          eventFns.splice(rFnIndex, 1)
        }
      }
    }
  }

  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  trigger(name: K, data: R) {
    const { eventFnMap, eventResultMap } = this
    if (eventFnMap[name]) {
      eventFnMap[name]?.forEach((fn) => {
        fn(data)
      })
    }
    eventResultMap[name] = data
  }

  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay(name: K) {
    const { eventFnMap, eventResultMap } = this
    if (eventFnMap[name] && name in eventResultMap) {
      const lastResult = eventResultMap[name]
      eventFnMap[name]?.forEach((fn) => {
        fn(lastResult as R)
      })
    }
  }

  reset() {
    this.destroy()
  }

  /** destroy 清空已绑定的事件 */
  destroy() {
    this.eventResultMap = {}
    this.eventFnMap = {}
    this.eventKeyMap.clear()
  }
}

export const eventSubscribe = new EventSubscribe()
