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

基本用法

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

// 事件触发
eventSubscribe.trigger('hello', 'world')

// 最后一次 trigger 回放
eventSubscribe.replay('hello')

// 事件退订
eventSubscribe.off('hello', key)
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

## types

```typescript
/** 事件 hooks */
export interface EventResultMap {
  [eventName: string]: any
}
export interface EventFnMap {
  [eventName: string]: ((rs: any) => void)[]
}
/** 事件回调 */
export declare type EventCallback<R = any> = (rs: R) => void
export declare const eventSubscribe: {
  /**
   * 事件订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * @param fnKey: 用于去掉订阅时标识
   * @returns eventKey 订阅标识, 用于 off
   * */
  on<R = any>(
    name: string,
    callback: EventCallback<R>,
    immediate?: boolean | undefined,
    fnKey?: string | undefined
  ): string
  /**
   * 事件一次性订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @returns eventKey 订阅标识, 用于 off
   * */
  once<R_1 = any>(name: string, callback: EventCallback<R_1>): string
  /**
   * 事件退订
   * @param name: 事件名称
   * @param ctx: 订阅时方法 | 订阅标识
   * */
  off<R_2 = any>(name: string, ctx: string | EventCallback<R_2>): void
  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  trigger<R_3 = any>(name: string, data: R_3): void
  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay(name: string): void
  /** reset 清空已绑定的事件 */
  reset(): void
}
```
