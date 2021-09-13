/*!
 * event-subscribe esm 1.0.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
var EventSubscribe = /** @class */ (function () {
    function EventSubscribe() {
        this.eventResultMap = {};
        this.eventFnMap = {};
        /** 事件 key map */
        this.eventKeyMap = new Map();
        /** 事件key */
        this.eventKeyPadding = 0;
    }
    /** 格式化 事件key */
    EventSubscribe.prototype.formatEventKey = function (name, fnKey) {
        if (fnKey) {
            return "" + fnKey;
        }
        else {
            return name + "-" + this.eventKeyPadding++;
        }
    };
    /**
     * 事件订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 若订阅之前已经触发过，是否马上执行
     * @param fnKey: 用于去掉订阅时标识
     * @returns eventKey 订阅标识, 用于 off
     * */
    EventSubscribe.prototype.on = function (name, callback, immediate, fnKey) {
        var _a;
        var _b = this, eventFnMap = _b.eventFnMap, eventResultMap = _b.eventResultMap, eventKeyMap = _b.eventKeyMap;
        if (eventFnMap[name]) {
            (_a = eventFnMap[name]) === null || _a === void 0 ? void 0 : _a.push(callback);
        }
        else {
            eventFnMap[name] = [callback];
        }
        if (fnKey) {
            // 查看是否之前已经有绑定, 有则先去掉
            this.off(name, fnKey);
        }
        // key 关系初始化
        var eventKey = this.formatEventKey("" + name, fnKey);
        eventKeyMap.set(eventKey, callback);
        if (immediate && name in eventResultMap) {
            callback(eventResultMap[name]);
        }
        return eventKey;
    };
    /**
     * 事件多次性订阅, callback
     * 若返回 true, 则继续定义
     * 若返回 false， 自动取消订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 立刻执行
     * @returns eventKey 订阅标识, 用于 off
     * */
    EventSubscribe.prototype.onceUntil = function (name, callback, immediate) {
        var _this = this;
        var key = this.on(name, function (res) {
            if (!callback(res)) {
                _this.off(name, key);
            }
        }, immediate, this.formatEventKey("" + name));
        return key;
    };
    /**
     * 事件一次性订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @returns eventKey 订阅标识, 用于 off
     * */
    EventSubscribe.prototype.once = function (name, callback) {
        var _this = this;
        var key = this.on(name, function (res) {
            _this.off(name, key);
            callback(res);
        }, false, this.formatEventKey("" + name));
        return key;
    };
    /**
     * 事件退订
     * @param name: 事件名称
     * @param ctx: 订阅时方法 | 订阅标识
     * */
    EventSubscribe.prototype.off = function (name, ctx) {
        var _a = this, eventFnMap = _a.eventFnMap, eventKeyMap = _a.eventKeyMap;
        var eventFns = eventFnMap[name];
        var rFn;
        if (eventFns === null || eventFns === void 0 ? void 0 : eventFns.length) {
            if (typeof ctx === 'string') {
                rFn = eventKeyMap.get(ctx);
            }
            else {
                rFn = ctx;
            }
            if (rFn) {
                var rFnIndex = eventFns.indexOf(rFn);
                if (rFnIndex !== -1) {
                    eventFns.splice(rFnIndex, 1);
                }
            }
        }
    };
    /**
     * 事件广播
     * @param name: 事件名称
     * @param data: 入参数据
     * */
    EventSubscribe.prototype.trigger = function (name, data) {
        var _a;
        var _b = this, eventFnMap = _b.eventFnMap, eventResultMap = _b.eventResultMap;
        if (eventFnMap[name]) {
            (_a = eventFnMap[name]) === null || _a === void 0 ? void 0 : _a.forEach(function (fn) {
                fn(data);
            });
        }
        eventResultMap[name] = data;
    };
    /**
     * 事件回放
     * @param name: 事件名称
     * */
    EventSubscribe.prototype.replay = function (name) {
        var _a;
        var _b = this, eventFnMap = _b.eventFnMap, eventResultMap = _b.eventResultMap;
        if (eventFnMap[name] && name in eventResultMap) {
            var lastResult_1 = eventResultMap[name];
            (_a = eventFnMap[name]) === null || _a === void 0 ? void 0 : _a.forEach(function (fn) {
                fn(lastResult_1);
            });
        }
    };
    EventSubscribe.prototype.reset = function () {
        this.destroy();
    };
    /** destroy 清空已绑定的事件 */
    EventSubscribe.prototype.destroy = function () {
        this.eventResultMap = {};
        this.eventFnMap = {};
        this.eventKeyMap.clear();
    };
    return EventSubscribe;
}());
var eventSubscribe = new EventSubscribe();

export { EventSubscribe, eventSubscribe };
