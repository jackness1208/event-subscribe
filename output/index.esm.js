/*!
 * event-subscribe esm 0.3.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
var eventResultMap = {};
var eventFnMap = {};
/** 事件 key map */
var eventKeyMap = new Map();
/** 事件key */
var eventKeyPadding = 0;
/** 格式化 事件key */
function formatEventKey(name, fnKey) {
    if (fnKey) {
        return "" + fnKey;
    }
    else {
        return name + "-" + eventKeyPadding++;
    }
}
var eventSubscribe = {
    /**
     * 事件订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 若订阅之前已经触发过，是否马上执行
     * @param fnKey: 用于去掉订阅时标识
     * @returns eventKey 订阅标识, 用于 off
     * */
    on: function (name, callback, immediate, fnKey) {
        if (name in eventFnMap) {
            eventFnMap[name].push(callback);
        }
        else {
            eventFnMap[name] = [callback];
        }
        if (fnKey) {
            // 查看是否之前已经有绑定, 有则先去掉
            eventSubscribe.off(name, fnKey);
        }
        // key 关系初始化
        var eventKey = formatEventKey(name, fnKey);
        eventKeyMap.set(eventKey, callback);
        if (immediate && name in eventResultMap) {
            callback(eventResultMap[name]);
        }
        return eventKey;
    },
    /**
     * 事件一次性订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @returns eventKey 订阅标识, 用于 off
     * */
    once: function (name, callback) {
        var _this = this;
        var key = this.on(name, function (res) {
            _this.off(name, key);
            callback(res);
        }, false, formatEventKey(name));
        return key;
    },
    /**
     * 事件退订
     * @param name: 事件名称
     * @param ctx: 订阅时方法 | 订阅标识
     * */
    off: function (name, ctx) {
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
    },
    /**
     * 事件广播
     * @param name: 事件名称
     * @param data: 入参数据
     * */
    trigger: function (name, data) {
        if (name in eventFnMap) {
            eventFnMap[name].forEach(function (fn) {
                fn(data);
            });
        }
        eventResultMap[name] = data;
    },
    /**
     * 事件回放
     * @param name: 事件名称
     * */
    replay: function (name) {
        if (name in eventFnMap && name in eventResultMap) {
            var lastResult_1 = eventResultMap[name];
            eventFnMap[name].forEach(function (fn) {
                fn(lastResult_1);
            });
        }
    },
    /** reset 清空已绑定的事件 */
    reset: function () {
        eventResultMap = {};
        eventFnMap = {};
        eventKeyMap.clear();
    }
};

export { eventSubscribe };
