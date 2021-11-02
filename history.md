# 版本变更
## 1.5.4 (2021-11-02)
- feat: 拆分 test
- fix: trigger 添加逻辑 避免死循环

## 1.5.3 (2021-11-02)

- feat: 补充 log

## 1.5.2 (2021-11-02)

- fix: 调整 types

## 1.5.1 (2021-11-02)

- fix: `op.eventWithPreserve` 改为选填项

## 1.5.0 (2021-11-01)

- feat: 新增 `new EventSubscribe(op)` `op.eventWithPreserve` 属性
- feat: 新增 `onWithPreserve` 方法, 配合 `op.eventWithPreserve` 使用
- feat: 新增 `getPreserve` 方法, 配合 `op.eventWithPreserve` 使用

## 1.4.0 (2021-10-22)

- feat: 补充 `new EventSubscribe({ logger })` `logger` 属性

## 1.3.2 (2021-10-20)

- fix: 修复 `once` 方法回调后 会影响后续 `on` 事件回调的执行

## 1.3.1 (2021-10-20)

- fix: 修复`on(event, fn, immidate)` 若之前触发了对应的 event 并返回 undefined 时，事件没被正常触发的问题

## 1.3.0 (2021-10-19)

- feat: `trigger(event, fn, ignoreUndefined)` 新增 `ignoreUndefined` 参数

## 1.2.1 (2021-09-20)

- fix: once() bugfix

## 1.2.0 (2021-09-19)

- feat: 补充 `once(key, fn, immediate)` 中 `immediate` 属性

## 1.1.0 (2021-09-19)

- feat: 新增 `EventSubscribe<TriggerMap,FilterMap>` 类型定义
- feat: 添加 `addFilter(key, fn)` 方法, 用于 trigger 后的 事件处理中间件

## 1.0.0 (2021-09-14)

- feat: 新增 `eventSubscribe.onceUntil(name, fn, immediate)` 函数
- feat: 新增 `EventSubscribe` 类，并且运行直接在 new 时把 map 传进去

## 0.3.0 (2021-08-03)

- feat: 新增 `eventSubscribe.once(name, fn)`

## 0.2.0 (2021-07-21)

- feat: 新增 `eventSubscribe.on(name, fn, immediate, key)` `key` 属性 用于定义绑定函数唯一 key 值
- feat: 新增 `eventSubscribe.off(name, fn|key)` 方法 用于 退订事件
