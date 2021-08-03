/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}

export interface EventFnMap {
  [eventName: string]: ((rs: any) => void)[]
}

let eventResultMap: EventResultMap = {}
let eventFnMap: EventFnMap = {}

/** 事件 key map */
const eventKeyMap = new Map<string, EventCallback>()

/** 事件key */
let eventKeyPadding = 0
/** 格式化 事件key */
function formatEventKey(name: string, fnKey?: string) {
  if (fnKey) {
    return `${fnKey}`
  } else {
    return `${name}-${eventKeyPadding++}`
  }
}

/** 事件回调 */
export type EventCallback<R = any> = (rs: R) => void

export const eventSubscribe = {
  /**
   * 事件订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   * */
  on<R = any>(name: string, callback: EventCallback<R>, immediate?: boolean, fnKey?: string) {
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
  },

  /**
   * 事件一次性订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @returns eventKey 订阅标识, 用于 off
   * */
  once<R = any>(name: string, callback: EventCallback<R>) {
    const key = this.on<R>(
      name,
      (res) => {
        this.off(name, key)
        callback(res)
      },
      false,
      formatEventKey(name)
    )
    return key
  },
  /**
   * 事件退订
   * @param name: 事件名称
   * @param ctx: 订阅时方法 | 订阅标识
   * */
  off<R = any>(name: string, ctx: EventCallback<R> | string) {
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
    eventKeyMap.clear()
  }
}
