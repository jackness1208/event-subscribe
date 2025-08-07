/** 事件 hooks */
export interface __eventNameToResultMap {
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
  | '__markPreserve'
  | 'init'

/** logger 格式 */
export type EventSubscribeLogger<M extends __eventNameToResultMap> = (
  type: EventSubscribeLoggerType,
  eventName: keyof M,
  args: any[]
) => void

interface EventNameToKeysInfo {
  index: number
  key: string
  fn: EventCallback | undefined
}

export interface EventSubscribeOption<M extends __eventNameToResultMap> {
  /** 需要搭配 onWithPreserve 使用，记录列表事件的完整log */
  __eventWithPreserve?: (keyof M)[]
  /** log 存储上限 */
  __eventWithPreserveLimit?: number
  /** 自动事件绑定前缀 */
  autoEventPrefix?: () => string
  logger?: EventSubscribeLogger<M>
}
export class EventSubscribe<
  M extends __eventNameToResultMap,
  F extends Record<keyof M, any> = M,
  K extends keyof M = keyof M,
  R extends F[K] = F[K]
> {
  private __logger: EventSubscribeLogger<M> = function () {}
  /** 事件 结果 name -> data map */
  private __eventNameToResultMap: Map<K, R> = new Map()
  /** 事件 处理中间函数 name -> middles */
  private __eventNameToMiddlesMap: Map<K, FilterCallback<M[K], R>>
  /** 事件 map: name -> keys */
  private __eventNameToKeysMap: Map<string, string[]>
  /** 事件 key -> fn map */
  private __eventKeyToFnMap: Map<string, EventCallback<R>>
  /** 事件动态key用变了 */
  private __eventKeyPadding: number = 0
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  private __eventWithPreserve: (keyof M)[]
  private __eventWithPreserveNameToDatasMap: Map<K, F[K][]>
  /** 完整log 的上限 */
  private __eventWithPreserveLimit: number = 500

  /** 自动事件绑定前缀 */
  private __autoEventPrefix = () => ''

  /** destroy 时回调Fns */
  private __eventDestroyKeyToFnMap: Map<string, () => void>
  /** 订阅全部事件的 fns */
  private __eventEachKeyToFnMap: Map<string, (type: K, data: R) => void>
  /** 订阅全部事件的 历史记录列表 (用于 onEach()) */
  private __eventEachPreserves: { name: K; data: R }[] = []
  /** 初始化 */
  constructor(op?: EventSubscribeOption<M>) {
    // 数据初始化
    this.__eventDestroyKeyToFnMap = new Map()
    this.__eventEachKeyToFnMap = new Map()
    this.__eventWithPreserveNameToDatasMap = new Map()
    this.__eventWithPreserve = []
    this.__eventKeyToFnMap = new Map()
    this.__eventNameToKeysMap = new Map()
    this.__eventNameToMiddlesMap = new Map()

    if (op?.logger) {
      this.__logger = op.logger
    }
    if (op?.__eventWithPreserve) {
      this.__eventWithPreserve = op.__eventWithPreserve
      this.__logger('init', 'constructor', ['__eventWithPreserve:', this.__eventWithPreserve])
    }
    if (op?.__eventWithPreserveLimit !== undefined) {
      this.__eventWithPreserveLimit = op.__eventWithPreserveLimit
    }
    if (op?.autoEventPrefix) {
      this.__autoEventPrefix = op.autoEventPrefix
    }
  }

  /** 根据 name 获取对应的回调函数列表 */
  private __getFnsFromName(name: K): EventNameToKeysInfo[] {
    const keys = this.__eventNameToKeysMap.get(`${name as string}`)
    if (!keys) {
      return []
    } else {
      return keys
        .map((key, index) => {
          return {
            index,
            key,
            fn: this.__eventKeyToFnMap.get(key)
          }
        })
        .filter((info) => !!info.fn)
    }
  }

  /** 格式化 事件key */
  private __formatEventKey(name: string, fnKey?: string) {
    const prefix = this.__autoEventPrefix()
    if (prefix) {
      if (fnKey) {
        return `${prefix}-${fnKey}`
      } else {
        return `${prefix}-${name}-${this.__eventKeyPadding++}`
      }
    } else {
      if (fnKey) {
        return fnKey
      } else {
        return `${name}-${this.__eventKeyPadding++}`
      }
    }
  }

  /** 添加历史记录 */
  private __markPreserve(name: K, data: R) {
    const needMark = this.__eventWithPreserve.includes(name)
    if (!needMark) {
      return
    }
    const datas: R[] = this.__eventWithPreserveNameToDatasMap.get(name) || []

    // 当超过上限时，移除最旧的数据
    if (datas.length + 1 > this.__eventWithPreserveLimit) {
      datas.splice(0, datas.length - this.__eventWithPreserveLimit + 1)
    }
    datas.push(data)

    this.__logger('__markPreserve', name, ['history total:', datas.length, 'data:', data])
    this.__eventWithPreserveNameToDatasMap.set(name, datas)
  }

  /**
   * 事件订阅（包含订阅前已触发的日志）
   * 需搭配 op.__eventWithPreserve 使用
   * @param name: 事件名称
   * @param done: 回调方法
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   */
  onWithPreserve<IK extends K, IR = F[IK]>(name: IK, done: EventCallback<IR>, fnKey?: string) {
    this.__logger('onWithPreserve', name, [`fnKey: ${fnKey}`])
    const preserveLogs = this.__eventWithPreserveNameToDatasMap.get(name)
    if (preserveLogs?.length) {
      preserveLogs.forEach((ctx) => {
        done(ctx)
      })
    }
    return this.on(name, done, false, fnKey)
  }

  /**
   * 获取历史记录
   * 需搭配 op.__eventWithPreserve 使用
   * @param name: 事件名称
   * @returns 事件返回 arr
   */
  getPreserve<IK extends K, IR = F[IK]>(name: IK): IR[] {
    const r = this.__eventWithPreserveNameToDatasMap.get(name) || []
    this.__logger('getPreserve', name, ['r:', r])
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
    const eventKey = this.__formatEventKey(`__each`, fnKey)
    this.__eventEachKeyToFnMap.set(eventKey, fn as () => void)
    this.__logger('onEach', 'bind', [eventKey])

    // 把历史记录上的都触发一次
    if (immediate) {
      this.__eventEachPreserves.forEach(({ name, data }) => {
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
      const eventKey = this.__formatEventKey(`__each`, ctx)
      const iFn = this.__eventEachKeyToFnMap.get(eventKey)
      if (iFn) {
        this.__eventEachKeyToFnMap.delete(eventKey)
        this.__logger('offEach', 'eventKey', [eventKey])
      }
    } else {
      Array.from(this.__eventEachKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.__eventEachKeyToFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.__eventEachKeyToFnMap.delete(key)
          this.__logger('offEach', 'eventKey', [key])
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
    const keys = Array.from(this.__eventEachKeyToFnMap.keys())
    if (keys.length) {
      this.__logger('triggerEach', '事件触发', [
        'data:',
        data,
        `eventKeys[${keys.length}]`,
        keys.join(', ')
      ])
    }

    keys.forEach((key) => {
      const iFn = this.__eventEachKeyToFnMap.get(key)
      if (iFn) {
        iFn(name, data)
      }
    })

    // 去掉之前触发过的
    for (let i = 0; i < this.__eventEachPreserves.length; i) {
      const iObj = this.__eventEachPreserves[i]
      if (iObj.name === name) {
        this.__eventEachPreserves.splice(i, 1)
      } else {
        i++
      }
    }
    // 添加 preserves
    this.__eventEachPreserves.push({ name, data })
  }

  /** destroy 订阅 */
  public onDestroy(fn: () => void, fnKey?: string) {
    // this.eventAllFns.push(fn as () => void)
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.offDestroy(fnKey)
    }
    // key 关系初始化
    const eventKey = this.__formatEventKey(`__destroy`, fnKey)
    this.__eventDestroyKeyToFnMap.set(eventKey, fn)
    this.__logger('onDestroy', 'bind', [eventKey])
    return eventKey
  }

  /** 取消 destroy 订阅 */
  offDestroy(ctx: string | ((...args: any[]) => void)) {
    if (typeof ctx === 'string') {
      const key = this.__formatEventKey(`__destroy`, ctx)
      const iFn = this.__eventDestroyKeyToFnMap.get(key)
      if (iFn) {
        this.__eventDestroyKeyToFnMap.delete(ctx)
        this.__logger('offDestroy', '解除绑定', [key])
      }
    } else {
      Array.from(this.__eventDestroyKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.__eventDestroyKeyToFnMap.get(key)
        if (iFn && iFn === ctx) {
          this.__eventDestroyKeyToFnMap.delete(key)
          this.__logger('offDestroy', '解除绑定', [key])
        }
      })
    }
  }

  /**
   * 全局事件订阅 不受 prefix 影响, 当设置 autoPrefix 时， 执行destroy 不会被取消订阅
   * @param name: 事件名称
   * @param done: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   * */
  onGlobal<IK extends K, IR = F[IK]>(
    name: IK,
    done: EventCallback<IR>,
    immediate?: boolean,
    fnKey?: string
  ) {
    const { __eventNameToResultMap, __eventKeyToFnMap, __eventNameToKeysMap } = this
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.off(name, fnKey)
    }

    // key 关系初始化
    const evetName = String(name)
    const eventKey = this.__formatEventKey(evetName, fnKey)
    __eventKeyToFnMap.set(eventKey, done)
    const keys = __eventNameToKeysMap.get(evetName) || []
    if (!keys.includes(eventKey)) {
      keys.push(eventKey)
      __eventNameToKeysMap.set(evetName, keys)
    }

    if (immediate && __eventNameToResultMap.has(name)) {
      const data = __eventNameToResultMap.get(name) as IR
      this.__logger('on', name, [
        `on(${String(
          name
        )}, fn, immediate: ${!!immediate}, eventKey: ${eventKey}), 立马触发一次, data:`,
        data
      ])
      done(data)
    } else {
      this.__logger('on', name, [
        `on(${String(name)}, fn, immediate: ${!!immediate}, eventKey: ${eventKey})`
      ])
    }
    return eventKey
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
    const { __eventNameToResultMap, __eventKeyToFnMap, __eventNameToKeysMap } = this
    if (fnKey) {
      // 查看是否之前已经有绑定, 有则先去掉
      this.off(name, fnKey)
    }

    // key 关系初始化
    const evetName = String(name)
    const eventKey = this.__formatEventKey(evetName, fnKey)
    __eventKeyToFnMap.set(eventKey, done)
    const keys = __eventNameToKeysMap.get(evetName) || []
    if (!keys.includes(eventKey)) {
      keys.push(eventKey)
      __eventNameToKeysMap.set(evetName, keys)
    }

    if (immediate && __eventNameToResultMap.has(name)) {
      const data = __eventNameToResultMap.get(name) as IR
      this.__logger('on', name, [
        `on(${String(
          name
        )}, fn, immediate: ${!!immediate}, eventKey: ${eventKey}), 立马触发一次, data:`,
        data
      ])
      done(data)
    } else {
      this.__logger('on', name, [
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
    this.__logger('onceUntil', name, [`immediate: ${immediate}`])
    const key = this.on(
      name,
      (res) => {
        if (!callback(res)) {
          this.off(name, key)
        }
      },
      immediate,
      this.__formatEventKey(`${String(name)}`)
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
    this.__logger('once', name, [`immediate: ${immediate}`])
    const { __eventNameToResultMap } = this
    const iResult = __eventNameToResultMap.get(name)
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
    const { __eventNameToKeysMap, __eventKeyToFnMap } = this
    const eventName = String(name)
    const fnInfos = this.__getFnsFromName(name)
    let info: EventCallback | undefined
    let matchedInfo: EventNameToKeysInfo | undefined
    if (fnInfos.length) {
      if (typeof ctx === 'string') {
        const key = this.__formatEventKey(eventName, ctx)
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
      __eventKeyToFnMap.delete(matchedInfo.key)
      const keys = __eventNameToKeysMap.get(eventName) || []
      const index = keys.indexOf(matchedInfo.key)
      if (index !== -1) {
        keys.splice(index, 1)
        __eventNameToKeysMap.set(eventName, keys)
      }
      this.__logger('off', name, [`eventKey: ${matchedInfo.key}`])
    }
  }

  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * @param ignoreUndefined: 避免返回 undefined
   * */
  async trigger<IK extends K, IR extends M[IK]>(name: IK, data: IR, ignoreUndefined?: boolean) {
    const { __eventNameToResultMap, __eventNameToMiddlesMap, __eventWithPreserve } = this

    const middleHandle = __eventNameToMiddlesMap.get(name)
    let result: M[K] | R = data
    if (middleHandle) {
      result = await middleHandle(data)
    }

    if (!ignoreUndefined || ![undefined, null].includes(result)) {
      __eventNameToResultMap.set(name, result)
      const fnInfos = this.__getFnsFromName(name)

      // trigger 日志打印
      if (!__eventWithPreserve.includes(name)) {
        this.__logger('trigger', name, [
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
      this.__markPreserve(name, result)
      // 触发 onEach
      this.triggerEach(name, result)
    }
  }

  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay<IK extends K>(name: IK) {
    this.__logger('replay', name, [])
    const { __eventNameToResultMap, __eventNameToMiddlesMap } = this
    const fnInfos = this.__getFnsFromName(name)
    if (fnInfos && __eventNameToResultMap.has(name)) {
      const lastResult = __eventNameToResultMap.get(name)
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
    this.__logger('addFilter', name, [])
    const { __eventNameToMiddlesMap } = this
    __eventNameToMiddlesMap.set(name, done)
  }

  /** 获取事件 cache */
  getCache<IK extends K, IM extends M[IK]>(key: IK) {
    return this.__eventNameToResultMap.get(key) as IM | undefined
  }

  /** 同 destroy */
  reset() {
    this.destroy()
  }

  /** destroy 清空已绑定的事件 */
  destroy() {
    const prefix = this.__autoEventPrefix()
    if (prefix) {
      this.__logger('destroy', prefix, [])
      // 只清除当前prefix 绑定的事件
      const {
        __eventNameToKeysMap,
        __eventKeyToFnMap,
        __eventDestroyKeyToFnMap,
        __eventEachKeyToFnMap
      } = this
      const eventKeys = Array.from(__eventKeyToFnMap.keys()).filter((key) => {
        return key.startsWith(prefix)
      })

      this.__logger('destroy', 'eventKeys', eventKeys)

      // 映射删除 name -> keys
      const eventNames = Array.from(__eventNameToKeysMap.keys())
      eventNames.forEach((eventName) => {
        const curKeys = __eventNameToKeysMap.get(eventName)
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
            __eventNameToKeysMap.set(eventName, curKeys)
          }
        }
      })

      // 映射删除 key -> fn
      eventKeys.forEach((key) => {
        __eventKeyToFnMap.delete(key)
      })

      // each 映射删除 key -> fn
      Array.from(__eventEachKeyToFnMap.keys()).forEach((key) => {
        if (key.startsWith(prefix)) {
          __eventEachKeyToFnMap.delete(key)
        }
      })

      // destroy key -> fn
      Array.from(__eventDestroyKeyToFnMap.keys()).forEach((key) => {
        if (key.startsWith(prefix)) {
          const iFn = __eventDestroyKeyToFnMap.get(key)
          iFn && iFn()
          __eventDestroyKeyToFnMap.delete(key)
        }
      })
      // __eventEachPreserves, __eventWithPreserveNameToDatasMap 继续沿用不需要 destroy
    } else {
      this.__logger('destroy', '', [])
      this.__eventNameToResultMap.clear()
      this.__eventNameToKeysMap.clear()
      this.__eventKeyToFnMap.clear()
      this.__eventEachPreserves = []
      this.__eventWithPreserveNameToDatasMap.clear()
      this.__eventEachKeyToFnMap.clear()

      // 调用 onDestroy 绑定的事件
      Array.from(this.__eventDestroyKeyToFnMap.keys()).forEach((key) => {
        const iFn = this.__eventDestroyKeyToFnMap.get(key)
        iFn && iFn()
      })
      this.__eventDestroyKeyToFnMap.clear()
    }
  }
}

export const eventSubscribe = new EventSubscribe()

if (typeof module !== 'undefined' && module.exports) {
  module.exports.EventSubscribe = EventSubscribe
  module.exports.eventSubscribe = eventSubscribe
}
