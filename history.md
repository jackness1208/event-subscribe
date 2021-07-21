# 版本变更

## 0.2.0 (2021-07-21)

- feat: 新增 `eventSubscribe.on(name, fn, immediate, key)` `key` 属性 用于定义绑定函数唯一key值
- feat: 新增 `eventSubscribe.off(name, fn|key)` 方法 用于 退订事件