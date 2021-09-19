# 版本变更

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
