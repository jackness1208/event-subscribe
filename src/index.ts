/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}

/** 事件回调 */
export type EventCallback<R = any> = (rs: R) => void
/** 过滤函数回调 */
export type FilterCallback<I = any, O = any> = (rs: I) => Promise<O>
/** 条件性调用回调 */
export type EventOnceUntilCallback<R = any> = (rs: R) => boolean | undefined

export interface EventFnMap {
  [eventName: string]: EventCallback[]
}

/** logger type */
export type EventSubscribeLoggerType =
  | 'addFilter'
  | 'replay'
  | 'trigger'
  | 'destroy'
  | 'on'
  | 'off'
  | 'once'
  | 'onceUntil'
  | 'onWithPreserve'
  | 'getPreserve'

/** logger 格式 */
export type EventSubscribeLogger<M extends EventResultMap> = (
  type: EventSubscribeLoggerType,
  eventName: keyof M,
  args: any[]
) => void

export interface EventSubscribeOption<M extends EventResultMap> {
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  eventWithPreserve?: (keyof M)[]
  /** log 存储上限 */
  eventWithPreserveLimit?: number
  logger?: EventSubscribeLogger<M>
}
export class EventSubscribe<
  M extends EventResultMap,
  F extends Record<keyof M, any> = M,
  K extends keyof M = keyof M,
  R extends F[K] = F[K]
> {
  private logger: EventSubscribeLogger<M> = function () {}
  /** 事件 结果 map */
  private eventResultMap: Map<K, R> = new Map()
  /** 事件 filterMap */
  private eventFilterMap: Map<K, FilterCallback<M[K], R>> = new Map()
  private eventFnMap: Map<K, EventCallback<R>[]> = new Map()
  /** 事件 key map */
  private eventKeyMap: Map<string, EventCallback<R>> = new Map()
  /** 事件key */
  private eventKeyPadding: number = 0
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  private eventWithPreserve: (keyof M)[] = []
  private eventWithPreserveMap: Map<K, F[K][]> = new Map()
  /** 完整log 的上限 */
  private eventWithPreserveLimit: number = 500

  /** destroy 时回调Fns */
  private eventDestroyFnMap: Map<string, () => void> = new Map()
  /** 订阅全部事件的 fns */
  private eventEachFnMap: Map<string, (type: K, data: R) => void> = new Map()
  /** 订阅全部事件的 历史记录列表 (用于 onEach()) */
  private eventEachPreserves: { name: K; data: R }[] = []
  /** 初始化 */
  constructor(op?: EventSubscribeOption<M>) {
    if (op?.eventWithPreserve) {
      this.eventWithPreserve = op.eventWithPreserve
    }
    if (op?.eventWithPreserveLimit !== undefined) {
      this.eventWithPreserveLimit = op.eventWithPreserveLimit
    }
    if (op?.logger) {
      this.logger = op.logger
    }
  }

  /** 格式化 事件key */
  private formatEventKey(name: string, fnKey?: string) {
    if (fnKey) {
      return `${fnKey}`
    } else {
      return `${name}-${this.eventKeyPadding++}`
    }
  }

  /** 添加历史记录 */
  private markPreserve(name: K, data: R) {
    const needMark = this.eventWithPreserve.includes(name)
    if (!needMark) {
      return
    }
    const datas: R[] = this.eventWithPreserveMap.get(name) || []

    // 当超过上限时，移除最旧的数据
    if (datas.length + 1 > this.eventWithPreserveLimit) {
      datas.splice(0, datas.length - this.eventWithPreserveLimit + 1)
    }
    datas.push(data)

    this.eventWithPreserveMap.set(name, datas)
  }

  /**
   * 事件订阅（包含订阅前已触发的日志）
   * 需搭配 op.eventWithPreserve 使用
   * @param name: 事件名称
   * @param done: 回调方法
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   */
  onWithPreserve<IK extends K, IR = F[IK]>(name: IK, done: EventCallback<IR>, fnKey?: string) {
    this.logger('onWithPreserve', name, [`fnKey: ${fnKey}`])
    const preserveLogs = this.eventWithPreserveMap.get(name)
    if (preserveLogs?.length) {
      preserveLogs.forEach((ctx) => {
        done(ctx)
      })
    }
    return this.on(name, done, false, fnKey)
  }

  /**
   * 获取历史记录
   * 需搭配 op.eventWithPreserve 使用
   * @param name: 事件名称
   * @returns 事件返回 arr
   */
  getPreserve<IK extends K, IR = F[IK]>(name: IK): IR[] {
    const r = this.eventWithPreserveMap.get(name) || []
    this.logger('getPreserve', name, ['r:', r])
    return r
  }

  /**
   * 订阅所有已绑定事件
   * @param fn: 回调方法
   * @returns eventKey 订阅标识, 用于 offEach
   * */
  onEach<IK extends K, IR = F[IK]>(
    fn: (type: IK, data: IR) => void,
    immediate?: boolean,
    fnKey?: string
  ) {
    // this.eventAllFns.push(fn as () => void)
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.offEach(fnKey)
    }
    // key 关系初始化
    const eventKey = this.formatEventKey(`__each`, fnKey)
    this.eventEachFnMap.set(eventKey, fn as () => void)

    // 把历史记录上的都触发一次
    if (immediate) {
      this.eventEachPreserves.forEach(({ name, data }) => {
        fn(name as IK, data)
      })
    }
    return eventKey
  }

  /**
   * 退订阅通过 onEach 绑定的事件
   * @param ctx: 订阅时方法 | 订阅标识
   * @returns eventKey 订阅标识, 用于 offAll
   * */
  offEach(ctx: string | ((...args: any[]) => void)) {
    if (typeof ctx === 'string') {
      const iFn = this.eventEachFnMap.get(ctx)
      if (iFn) {
        this.eventEachFnMap.delete(ctx)
      }
    } else {
      Array.from(this.eventEachFnMap.keys()).forEach((key) => {
        const iFn = this.eventEachFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.eventEachFnMap.delete(key)
        }
      })
    }
  }

  /**
   * onEach 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  private triggerEach<IK extends K, IR extends M[IK]>(name: K, data: IR) {
    // 把已经订阅 onEach 的都触发一次
    Array.from(this.eventEachFnMap.keys()).forEach((key) => {
      const iFn = this.eventEachFnMap.get(key)
      if (iFn) {
        iFn(name, data)
      }
    })

    // 去掉之前触发过的
    for (let i = 0; i < this.eventEachPreserves.length; i) {
      const iObj = this.eventEachPreserves[i]
      if (iObj.name === name) {
        this.eventEachPreserves.splice(i, 1)
      } else {
        i++
      }
    }
    // 添加 preserves
    this.eventEachPreserves.push({ name, data })
  }

  /** destroy 订阅 */
  public onDestroy(fn: () => void, fnKey?: string) {
    // this.eventAllFns.push(fn as () => void)
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.offDestroy(fnKey)
    }
    // key 关系初始化
    const eventKey = this.formatEventKey(`__destroy`, fnKey)
    this.eventDestroyFnMap.set(eventKey, fn)
    return eventKey
  }

  /** 取消 destroy 订阅 */
  public offDestroy(ctx: string | ((...args: any[]) => void)) {
    if (typeof ctx === 'string') {
      const iFn = this.eventDestroyFnMap.get(ctx)
      if (iFn) {
        this.eventDestroyFnMap.delete(ctx)
      }
    } else {
      Array.from(this.eventDestroyFnMap.keys()).forEach((key) => {
        const iFn = this.eventDestroyFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.eventDestroyFnMap.delete(key)
        }
      })
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
  on<IK extends K, IR = F[IK]>(
    name: IK,
    done: EventCallback<IR>,
    immediate?: boolean,
    fnKey?: string
  ) {
    this.logger('on', name, [`immediate: ${immediate}`, `fnKey: ${fnKey}`])
    const { eventFnMap, eventResultMap, eventKeyMap } = this
    const iEvents = eventFnMap.get(name)
    if (!iEvents) {
      eventFnMap.set(name, [done])
    } else {
      iEvents.push(done)
      eventFnMap.set(name, iEvents)
    }

    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.off(name, fnKey)
    }

    // key 关系初始化
    const eventKey = this.formatEventKey(`${String(name)}`, fnKey)
    eventKeyMap.set(eventKey, done)

    if (immediate) {
      if (eventResultMap.has(name)) {
        done(eventResultMap.get(name) as IR)
      }
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
  onceUntil<IK extends K, IR extends F[IK]>(
    name: IK,
    callback: EventOnceUntilCallback<IR>,
    immediate?: boolean
  ) {
    this.logger('onceUntil', name, [`immediate: ${immediate}`])
    const key = this.on(
      name,
      (res) => {
        if (!callback(res)) {
          this.off(name, key)
        }
      },
      immediate,
      this.formatEventKey(`${String(name)}`)
    )
    return key
  }

  /**
   * 事件一次性订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @returns eventKey 订阅标识, 用于 off
   * */
  once<IK extends K, IR extends F[IK]>(name: IK, done: EventCallback<IR>, immediate?: boolean) {
    this.logger('once', name, [`immediate: ${immediate}`])
    const { eventResultMap } = this
    const iResult = eventResultMap.get(name)
    if (immediate && iResult) {
      done(iResult)
    } else {
      const key = this.on(
        name,
        (res) => {
          this.off(name, key)
          done(res)
        },
        immediate
      )
      return key
    }
  }

  /**
   * 事件退订
   * @param name: 事件名称
   * @param ctx: 订阅时方法 | 订阅标识
   * */
  off<IK extends K, IR extends F[IK]>(name: IK, ctx: EventCallback<IR> | string) {
    this.logger('off', name, [`ctx: ${ctx}`])
    const { eventFnMap, eventKeyMap } = this
    const eventFns = eventFnMap.get(name)
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
   * @param ignoreUndefined: 避免返回 undefined
   * */
  async trigger<IK extends K, IR extends M[IK]>(name: IK, data: IR, ignoreUndefined?: boolean) {
    const { eventFnMap, eventResultMap, eventFilterMap, eventWithPreserve } = this

    const iFilter = eventFilterMap.get(name)
    let result: M[K] | R = data
    if (iFilter) {
      result = await iFilter(data)
      // 避免死循环
      if (!eventWithPreserve.includes(name)) {
        this.logger('trigger', `${String(name)}`, [data, '=>', result])
      }
    } else {
      // 避免死循环
      if (!eventWithPreserve.includes(name)) {
        this.logger('trigger', `${String(name)}`, [result])
      }
    }

    if (!ignoreUndefined || ![undefined, null].includes(result)) {
      eventResultMap.set(name, result)
      const iFns = eventFnMap.get(name)
      if (iFns) {
        // 防止循环过程中 off 导致后续循环不连续
        Array.from(iFns).forEach((fn) => {
          fn(result)
        })
      }
      // 添加历史记录（如需要）
      this.markPreserve(name, result)
      // 触发 onEach
      this.triggerEach(name, result)
    }
  }

  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay<IK extends K>(name: IK) {
    this.logger('replay', name, [])
    const { eventFnMap, eventResultMap, eventFilterMap } = this
    const iFns = eventFnMap.get(name)
    if (iFns && eventResultMap.has(name)) {
      const lastResult = eventResultMap.get(name)
      iFns.forEach((fn) => {
        fn(lastResult as R)
      })
    }
  }

  /**
   * 添加处理函数
   * @param name 事件 名称
   * @param done 过滤方法
   */
  async addFilter<IK extends K, IM extends M[IK], IR extends R>(
    name: IK,
    done: FilterCallback<IM, IR>
  ) {
    this.logger('addFilter', name, [])
    const { eventFilterMap } = this
    eventFilterMap.set(name, done)
  }

  /** 获取事件 cache */
  getCache<IK extends K, IM extends M[IK]>(key: IK) {
    return this.eventResultMap.get(key) as IM | undefined
  }

  /** 同 destroy */
  reset() {
    this.destroy()
  }

  /** destroy 清空已绑定的事件 */
  destroy() {
    this.logger('destroy', '', [])
    this.eventResultMap.clear()
    this.eventFnMap.clear()
    this.eventKeyMap.clear()
    this.eventEachPreserves = []
    this.eventWithPreserveMap.clear()
    this.eventEachFnMap.clear()

    // 调用 onDestroy 绑定的事件
    Array.from(this.eventDestroyFnMap.keys()).forEach((key) => {
      const iFn = this.eventDestroyFnMap.get(key)
      iFn && iFn()
    })
    this.eventDestroyFnMap.clear()
  }
}

export const eventSubscribe = new EventSubscribe()

if (typeof module !== 'undefined' && module.exports) {
  module.exports.EventSubscribe = EventSubscribe
  module.exports.eventSubscribe = eventSubscribe
}
