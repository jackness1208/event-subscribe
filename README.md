# event-subscribe

用于管理事件的 订阅、触发、回放

## install

```bash
# yarn
yarn add event-subscribe
# npm
npm i event-subscribe --save
```

## usage

一般用法

```typescript
import { eventSubscribe } from 'event-subscribe'

// 事件订阅
const key = eventSubscribe.on('hello', (ctx) => {
  console.log('hello', ctx)
})

// 事件订阅并马上执行上次trigger
const subkey = eventSubscribe.on(
  'hello2',
  (ctx) => {
    console.log('hello2', ctx)
  },
  true
)

// 只监听一次
eventSubscribe.once('hello', (rs) => {
  // TODO:
})

// 有条件性监听
let padding = 0
eventSubscribe.onceUntil('hello', (rs) => {
  padding++
  if (padding > 3) {
    // 不再监听
    return false
  } else {
    // 继续监听
    return true
  }
})

// 添加 filter
eventSubscribe.addFilter('hello', async (rs) => {
  return `${rs} hello`
})

// 事件触发
eventSubscribe.trigger('hello', 'world')

// 最后一次 trigger 回放
eventSubscribe.replay('hello')

// 事件退订
eventSubscribe.off('hello', key)
```

类型用法

```typescript
import { EventSubscribe } from 'event-subscribe'

interface CallMap {
  hello: string
  hello2: number
}

interface FilterMap {
  hello: string
  hello2: string
}

// 好处是 可以 关联 所有 方法的 key 和 data 值
const eventSubscribe = new EventSubscribe<CallMap, FilterMap>()
```

唯一事件绑定

```typescript
import { eventSubscribe } from 'event-subscribe'
const eventKey = 'onlyOne'

eventSubscribe.on(
  'hello',
  (ctx) => {
    console.log('a', ctx)
  },
  false,
  eventKey
)

// 这里会清掉上面的 hello 从新进行绑定, 因为设置了唯一 key
eventSubscribe.on(
  'hello',
  (ctx) => {
    console.log('b', ctx)
  },
  false,
  eventKey
)

// 事件清空
eventSubscribe.off('hello', eventKey)
```

历史记录

```typescript
import { EventSubscribe } from 'event-subscribe'
const iBridge = new EventSubscribe({
  eventWithPreserve: ['log']
})

iBridge.trigger('log', 'hello 01')
iBridge.trigger('log', 'hello 02')
iBridge.onWithPreserve('log', (ctx) => {
  console.log('ctx') // hello 01, hello 02
})
console.log(iBridge.getPreserve('log')) // [hello 01, hello 02]
```

监听所有事件的触发

```typescript
import { EventSubscribe } from 'event-subscribe'
const iBridge = new EventSubscribe()

iBridge.trigger('hello', 1)
iBridge.trigger('world', 2)

// 订阅
const key = iBridge.onEach((type, data) => {
  console.log(`${type}-${data}`) // hello-1, world-2
}, true)

// 取消订阅
iBridge.offEach(key)
```

订阅 销毁事件

```typescript
import { EventSubscribe } from 'event-subscribe'
const iBridge = new EventSubscribe()
// 订阅 bridge 销毁
const key = iBridge.onDestroy(() => {
  console.log('destroy')
})

// 取消订阅
iBridge.offDestroy(key)

// 触发 bridge 销毁
iBridge.destroy()
```

## types

```typescript
/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}
/** 事件回调 */
export declare type EventCallback<R = any> = (rs: R) => void
/** 过滤函数回调 */
export declare type FilterCallback<I = any, O = any> = (rs: I) => Promise<O>
/** 条件性调用回调 */
export declare type EventOnceUntilCallback<R = any> = (rs: R) => boolean | undefined
export interface EventFnMap {
  [eventName: string]: EventCallback[]
}
/** logger type */
export declare type EventSubscribeLoggerType =
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
export declare type EventSubscribeLogger<M extends EventResultMap> = (
  type: EventSubscribeLoggerType,
  eventName: keyof M,
  args: any[]
) => void
export interface EventSubscribeOption<M extends EventResultMap> {
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  eventWithPreserve?: (keyof M)[]
  logger?: EventSubscribeLogger<M>
}
export declare class EventSubscribe<
  M extends EventResultMap,
  F extends Record<keyof M, any> = M,
  K extends keyof M = keyof M,
  R extends F[K] = F[K]
> {
  private logger
  /** 事件 结果 map */
  private eventResultMap
  /** 事件 filterMap */
  private eventNameToMiddlesMap
  private eventFnMap
  /** 事件 key map */
  private eventKeyToFnMap
  /** 事件key */
  private eventKeyPadding
  /** 搭配 onWithPreserve 使用，记录列表事件的完整log */
  private eventWithPreserve
  private eventWithPreserveNameToDatasMap
  /** destroy 时回调Fns */
  private eventDestroyKeyToFnMap
  /** 订阅全部事件的 fns */
  private eventEachKeyToFnMap
  /** 订阅全部事件的 历史记录列表 (用于 onEach()) */
  private eventEachPreserves
  /** 初始化 */
  constructor(op?: EventSubscribeOption<M>)
  /** 格式化 事件key */
  private formatEventKey
  /** 添加历史记录 */
  private markPreserve
  /**
   * 事件订阅（包含订阅前已触发的日志）
   * 需搭配 op.eventWithPreserve 使用
   * @param name: 事件名称
   * @param done: 回调方法
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   */
  onWithPreserve<IK extends K, IR = F[IK]>(
    name: IK,
    done: EventCallback<IR>,
    fnKey?: string
  ): string
  /**
   * 获取历史记录
   * 需搭配 op.eventWithPreserve 使用
   * @param name: 事件名称
   * @returns 事件返回 arr
   */
  getPreserve<IK extends K, IR = F[IK]>(name: IK): IR[]
  /**
   * 订阅所有已绑定事件
   * @param fn: 回调方法
   * @returns eventKey 订阅标识, 用于 offEach
   * */
  onEach<IK extends K, IR = F[IK]>(
    fn: (type: IK, data: IR) => void,
    immediate?: boolean,
    fnKey?: string
  ): string
  /**
   * 退订阅通过 onEach 绑定的事件
   * @param ctx: 订阅时方法 | 订阅标识
   * @returns eventKey 订阅标识, 用于 offAll
   * */
  offEach(ctx: string | ((...args: any[]) => void)): void
  /**
   * onEach 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  private triggerEach
  /** destroy 订阅 */
  onDestroy(fn: () => void, fnKey?: string): string
  /** 取消 destroy 订阅 */
  offDestroy(ctx: string | ((...args: any[]) => void)): void
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
  ): string
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
  ): string
  /**
   * 事件一次性订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @returns eventKey 订阅标识, 用于 off
   * */
  once<IK extends K, IR extends F[IK]>(
    name: IK,
    done: EventCallback<IR>,
    immediate?: boolean
  ): string | undefined
  /**
   * 事件退订
   * @param name: 事件名称
   * @param ctx: 订阅时方法 | 订阅标识
   * */
  off<IK extends K, IR extends F[IK]>(name: IK, ctx: EventCallback<IR> | string): void
  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * @param ignoreUndefined: 避免返回 undefined
   * */
  trigger<IK extends K, IR extends M[IK]>(
    name: IK,
    data: IR,
    ignoreUndefined?: boolean
  ): Promise<void>
  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay<IK extends K>(name: IK): void
  /**
   * 添加处理函数
   * @param name 事件 名称
   * @param done 过滤方法
   */
  addFilter<IK extends K, IM extends M[IK], IR extends R>(
    name: IK,
    done: FilterCallback<IM, IR>
  ): Promise<void>
  /** 同 destroy */
  reset(): void
  /** destroy 清空已绑定的事件 */
  destroy(): void
}
export declare const eventSubscribe: EventSubscribe<
  EventResultMap,
  EventResultMap,
  string | number,
  any
>
```
