/** 事件 hooks */
export interface eventNameToResultMap {
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
  | 'onEach'
  | 'offEach'
  | 'triggerEach'
  | 'onDestroy'
  | 'offDestroy'

/** logger 格式 */
export type EventSubscribeLogger<M extends eventNameToResultMap> = (
  type: EventSubscribeLoggerType,
  eventName: keyof M,
  args: any[]
) => void

interface EventNameToKeysInfo {
  index: number
  key: string
  fn: EventCallback | undefined
}

export interface EventSubscribeOption<M extends eventNameToResultMap> {
  /** 需要搭配 onWithPreserve 使用，记录列表事件的完整log */
  eventWithPreserve?: (keyof M)[]
  /** log 存储上限 */
  eventWithPreserveLimit?: number
  /** 自动事件绑定前缀 */
  autoEventPrefix?: () => string
  logger?: EventSubscribeLogger<M>
}
export class EventSubscribe<
  M extends eventNameToResultMap,
  F extends Record<keyof M, any> = M,
  K extends keyof M = keyof M,
  R extends F[K] = F[K]
> {
  private logger: EventSubscribeLogger<M> = function () {}
  /** 事件 结果 name -> data map */
  private eventNameToResultMap: Map<K, R> = new Map()
  /** 事件 处理中间函数 name -> middles */
  private eventNameToMiddlesMap: Map<K, FilterCallback<M[K], R>>
  /** 事件 map: name -> keys */
  private eventNameToKeysMap: Map<string, string[]>
  /** 事件 key -> fn map */
  private eventKeyToFnMap: Map<string, EventCallback<R>>
  /** 事件动态key用变了 */
  private eventKeyPadding: number = 0
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  private eventWithPreserve: (keyof M)[]
  private eventWithPreserveNameToDatasMap: Map<K, F[K][]>
  /** 完整log 的上限 */
  private eventWithPreserveLimit: number = 500

  /** 自动事件绑定前缀 */
  private autoEventPrefix = () => ''

  /** destroy 时回调Fns */
  private eventDestroyKeyToFnMap: Map<string, () => void>
  /** 订阅全部事件的 fns */
  private eventEachKeyToFnMap: Map<string, (type: K, data: R) => void>
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
    if (op?.autoEventPrefix) {
      this.autoEventPrefix = op.autoEventPrefix
    }

    // 数据初始化
    this.eventDestroyKeyToFnMap = new Map()
    this.eventEachKeyToFnMap = new Map()
    this.eventWithPreserveNameToDatasMap = new Map()
    this.eventWithPreserve = []
    this.eventKeyToFnMap = new Map()
    this.eventNameToKeysMap = new Map()
    this.eventNameToMiddlesMap = new Map()
  }

  /** 根据 name 获取对应的回调函数列表 */
  private getFnsFromName(name: K): EventNameToKeysInfo[] {
    const keys = this.eventNameToKeysMap.get(`${name as string}`)
    if (!keys) {
      return []
    } else {
      return keys
        .map((key, index) => {
          return {
            index,
            key,
            fn: this.eventKeyToFnMap.get(key)
          }
        })
        .filter((info) => !!info.fn)
    }
  }

  /** 格式化 事件key */
  private formatEventKey(name: string, fnKey?: string) {
    const prefix = this.autoEventPrefix()
    if (prefix) {
      if (fnKey) {
        return `${prefix}-${fnKey}`
      } else {
        return `${prefix}-${name}-${this.eventKeyPadding++}`
      }
    } else {
      if (fnKey) {
        return fnKey
      } else {
        return `${name}-${this.eventKeyPadding++}`
      }
    }
  }

  /** 添加历史记录 */
  private markPreserve(name: K, data: R) {
    const needMark = this.eventWithPreserve.includes(name)
    if (!needMark) {
      return
    }
    const datas: R[] = this.eventWithPreserveNameToDatasMap.get(name) || []

    // 当超过上限时，移除最旧的数据
    if (datas.length + 1 > this.eventWithPreserveLimit) {
      datas.splice(0, datas.length - this.eventWithPreserveLimit + 1)
    }
    datas.push(data)

    this.eventWithPreserveNameToDatasMap.set(name, datas)
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
    const preserveLogs = this.eventWithPreserveNameToDatasMap.get(name)
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
    const r = this.eventWithPreserveNameToDatasMap.get(name) || []
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
    this.eventEachKeyToFnMap.set(eventKey, fn as () => void)
    this.logger('onEach', 'bind', [eventKey])

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
      const eventKey = this.formatEventKey(`__each`, ctx)
      const iFn = this.eventEachKeyToFnMap.get(eventKey)
      if (iFn) {
        this.eventEachKeyToFnMap.delete(eventKey)
        this.logger('offEach', 'eventKey', [eventKey])
      }
    } else {
      Array.from(this.eventEachKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.eventEachKeyToFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.eventEachKeyToFnMap.delete(key)
          this.logger('offEach', 'eventKey', [key])
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
    const keys = Array.from(this.eventEachKeyToFnMap.keys())
    if (keys.length) {
      this.logger('triggerEach', '事件触发', [
        'data:',
        data,
        `eventKeys[${keys.length}]`,
        keys.join(', ')
      ])
    }

    keys.forEach((key) => {
      const iFn = this.eventEachKeyToFnMap.get(key)
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
    this.eventDestroyKeyToFnMap.set(eventKey, fn)
    this.logger('onDestroy', 'bind', [eventKey])
    return eventKey
  }

  /** 取消 destroy 订阅 */
  public offDestroy(ctx: string | ((...args: any[]) => void)) {
    if (typeof ctx === 'string') {
      const key = this.formatEventKey(`__destroy`, ctx)
      const iFn = this.eventDestroyKeyToFnMap.get(key)
      if (iFn) {
        this.eventDestroyKeyToFnMap.delete(ctx)
        this.logger('offDestroy', '解除绑定', [key])
      }
    } else {
      Array.from(this.eventDestroyKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.eventDestroyKeyToFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.eventDestroyKeyToFnMap.delete(key)
          this.logger('offDestroy', '解除绑定', [key])
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
    const { eventNameToResultMap, eventKeyToFnMap, eventNameToKeysMap } = this
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.off(name, fnKey)
    }

    // key 关系初始化
    const evetName = String(name)
    const eventKey = this.formatEventKey(evetName, fnKey)
    eventKeyToFnMap.set(eventKey, done)
    const keys = eventNameToKeysMap.get(evetName) || []
    if (!keys.includes(eventKey)) {
      keys.push(eventKey)
      eventNameToKeysMap.set(evetName, keys)
    }

    if (immediate && eventNameToResultMap.has(name)) {
      const data = eventNameToResultMap.get(name) as IR
      this.logger('on', name, [
        `on(${String(
          name
        )}, fn, immediate: ${!!immediate}, eventKey: ${eventKey}), 立马触发一次, data:`,
        data
      ])
      done(data)
    } else {
      this.logger('on', name, [
        `on(${String(name)}, fn, immediate: ${!!immediate}, eventKey: ${eventKey})`
      ])
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
    const { eventNameToResultMap } = this
    const iResult = eventNameToResultMap.get(name)
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
    const { eventNameToKeysMap, eventKeyToFnMap } = this
    const eventName = String(name)
    const fnInfos = this.getFnsFromName(name)
    let info: EventCallback | undefined
    let matchedInfo: EventNameToKeysInfo | undefined
    if (fnInfos.length) {
      if (typeof ctx === 'string') {
        const key = this.formatEventKey(eventName, ctx)
        fnInfos.forEach((info) => {
          if (info.key === key) {
            matchedInfo = info
          }
        })
      } else {
        fnInfos.forEach((info) => {
          if (info.fn === (ctx as Function)) {
            matchedInfo = info
          }
        })
      }
    }
    if (matchedInfo) {
      eventKeyToFnMap.delete(matchedInfo.key)
      const keys = eventNameToKeysMap.get(eventName) || []
      const index = keys.indexOf(matchedInfo.key)
      if (index !== -1) {
        keys.splice(index, 1)
        eventNameToKeysMap.set(eventName, keys)
      }
      this.logger('off', name, [`eventKey: ${matchedInfo.key}`])
    }
  }

  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * @param ignoreUndefined: 避免返回 undefined
   * */
  async trigger<IK extends K, IR extends M[IK]>(name: IK, data: IR, ignoreUndefined?: boolean) {
    const { eventNameToResultMap, eventNameToMiddlesMap, eventWithPreserve } = this

    const middleHandle = eventNameToMiddlesMap.get(name)
    let result: M[K] | R = data
    if (middleHandle) {
      result = await middleHandle(data)
    }

    if (!ignoreUndefined || ![undefined, null].includes(result)) {
      eventNameToResultMap.set(name, result)
      const fnInfos = this.getFnsFromName(name)

      // trigger 日志打印
      if (!eventWithPreserve.includes(name)) {
        this.logger('trigger', name, [
          'data:',
          result,
          `event total: ${fnInfos.length}`,
          `[${fnInfos.map((info) => info.key).join(',')}]`
        ])
      }

      if (fnInfos) {
        // 防止循环过程中 off 导致后续循环不连续
        fnInfos.forEach((info) => {
          info.fn && info.fn(result)
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
    const { eventNameToResultMap, eventNameToMiddlesMap } = this
    const fnInfos = this.getFnsFromName(name)
    if (fnInfos && eventNameToResultMap.has(name)) {
      const lastResult = eventNameToResultMap.get(name)
      fnInfos.forEach((info) => {
        info.fn && info.fn(lastResult as R)
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
    const { eventNameToMiddlesMap } = this
    eventNameToMiddlesMap.set(name, done)
  }

  /** 获取事件 cache */
  getCache<IK extends K, IM extends M[IK]>(key: IK) {
    return this.eventNameToResultMap.get(key) as IM | undefined
  }

  /** 同 destroy */
  reset() {
    this.destroy()
  }

  /** destroy 清空已绑定的事件 */
  destroy() {
    const prefix = this.autoEventPrefix()
    if (prefix) {
      this.logger('destroy', prefix, [])
      // 只清除当前prefix 绑定的事件
      const { eventNameToKeysMap, eventKeyToFnMap, eventDestroyKeyToFnMap, eventEachKeyToFnMap } =
        this
      const eventKeys = Array.from(eventKeyToFnMap.keys()).filter((key) => {
        return key.startsWith(prefix)
      })

      this.logger('destroy', 'eventKeys', eventKeys)

      // 映射删除 name -> keys
      const eventNames = Array.from(eventNameToKeysMap.keys())
      eventNames.forEach((eventName) => {
        const curKeys = eventNameToKeysMap.get(eventName)
        if (curKeys) {
          let isUpdate = false
          let padding = 5000
          for (let i = 0; i < curKeys.length && padding > 0; padding--) {
            const curKey = curKeys[i]
            if (eventKeys.includes(curKey)) {
              curKeys.splice(i, 1)
              isUpdate = true
            } else {
              i++
            }
          }
          if (isUpdate) {
            eventNameToKeysMap.set(eventName, curKeys)
          }
        }
      })

      // 映射删除 key -> fn
      eventKeys.forEach((key) => {
        eventKeyToFnMap.delete(key)
      })

      // each 映射删除 key -> fn
      Array.from(eventEachKeyToFnMap.keys()).forEach((key) => {
        if (key.startsWith(prefix)) {
          eventEachKeyToFnMap.delete(key)
        }
      })

      // destroy key -> fn
      Array.from(eventDestroyKeyToFnMap.keys()).forEach((key) => {
        if (key.startsWith(prefix)) {
          const iFn = eventDestroyKeyToFnMap.get(key)
          iFn && iFn()
          eventDestroyKeyToFnMap.delete(key)
        }
      })
      // eventEachPreserves, eventWithPreserveNameToDatasMap 继续沿用不需要 destroy
    } else {
      this.logger('destroy', '', [])
      this.eventNameToResultMap.clear()
      this.eventNameToKeysMap.clear()
      this.eventKeyToFnMap.clear()
      this.eventEachPreserves = []
      this.eventWithPreserveNameToDatasMap.clear()
      this.eventEachKeyToFnMap.clear()

      // 调用 onDestroy 绑定的事件
      Array.from(this.eventDestroyKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.eventDestroyKeyToFnMap.get(key)
        iFn && iFn()
      })
      this.eventDestroyKeyToFnMap.clear()
    }
  }
}

export const eventSubscribe = new EventSubscribe()

if (typeof module !== 'undefined' && module.exports) {
  module.exports.EventSubscribe = EventSubscribe
  module.exports.eventSubscribe = eventSubscribe
}
