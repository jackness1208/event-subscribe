/*!
 * eventbridge esm 0.1.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
var eventResultMap = {};
var eventFnMap = {};
var eventBridge = {
    /**
     * 事件订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 若订阅之前已经触发过，是否马上执行
     * */
    on: function (name, callback, immediate) {
        if (name in eventFnMap) {
            eventFnMap[name].push(callback);
        }
        else {
            eventFnMap[name] = [callback];
        }
        if (immediate && name in eventResultMap) {
            callback(eventResultMap[name]);
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
    }
};

export { eventBridge };
