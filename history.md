# 版本变更

## 1.0.0 (2021-09-14)

- feat: 新增 `eventSubscribe.onceUntil(name, fn, immediate)` 函数
- feat: 新增 `EventSubscribe` 类，并且运行直接在 new 时把 map 传进去

## 0.3.0 (2021-08-03)

- feat: 新增 `eventSubscribe.once(name, fn)`

## 0.2.0 (2021-07-21)

- feat: 新增 `eventSubscribe.on(name, fn, immediate, key)` `key` 属性 用于定义绑定函数唯一 key 值
- feat: 新增 `eventSubscribe.off(name, fn|key)` 方法 用于 退订事件
