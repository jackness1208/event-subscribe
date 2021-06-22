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

```typescript
import { eventSubscribe } from 'event-subscribe'

eventSubscribe.on('hello', (ctx) => {
  console.log('hello', ctx)
})

eventSubscribe.trigger('hello', 'world')
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
export declare const eventSubscribe: {
  /**
   * 事件订阅
   * @param name: 事件名称
   * @param callback: 回调方法
   * @param immediate: 若订阅之前已经触发过，是否马上执行
   * */
  on<R = any>(name: string, callback: (rs: R) => void, immediate?: boolean | undefined): void
  /**
   * 事件广播
   * @param name: 事件名称
   * @param data: 入参数据
   * */
  trigger<R_1 = any>(name: string, data: R_1): void
  /**
   * 事件回放
   * @param name: 事件名称
   * */
  replay(name: string): void
  /** reset 清空已绑定的事件 */
  reset(): void
}
```
