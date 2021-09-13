/** 事件 hooks */
export interface EventResultMap {
    [eventName: string]: any;
}
/** 事件回调 */
export declare type EventCallback<R = any> = (rs: R) => void;
export declare type EventOnceUntilCallback<R = any> = (rs: R) => boolean | undefined;
export interface EventFnMap {
    [eventName: string]: EventCallback[];
}
export declare class EventSubscribe<M extends EventResultMap = EventResultMap, K extends keyof M = keyof M, R = M[K]> {
    private eventResultMap;
    private eventFnMap;
    /** 事件 key map */
    private eventKeyMap;
    /** 事件key */
    private eventKeyPadding;
    /** 格式化 事件key */
    private formatEventKey;
    /**
     * 事件订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 若订阅之前已经触发过，是否马上执行
     * @param fnKey: 用于去掉订阅时标识
     * @returns eventKey 订阅标识, 用于 off
     * */
    on(name: K, callback: EventCallback<R>, immediate?: boolean, fnKey?: string): string;
    /**
     * 事件多次性订阅, callback
     * 若返回 true, 则继续定义
     * 若返回 false， 自动取消订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 立刻执行
     * @returns eventKey 订阅标识, 用于 off
     * */
    onceUntil(name: K, callback: EventOnceUntilCallback<R>, immediate?: boolean): string;
    /**
     * 事件一次性订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @returns eventKey 订阅标识, 用于 off
     * */
    once(name: K, callback: EventCallback<R>): string;
    /**
     * 事件退订
     * @param name: 事件名称
     * @param ctx: 订阅时方法 | 订阅标识
     * */
    off(name: K, ctx: EventCallback<R> | string): void;
    /**
     * 事件广播
     * @param name: 事件名称
     * @param data: 入参数据
     * */
    trigger(name: K, data: R): void;
    /**
     * 事件回放
     * @param name: 事件名称
     * */
    replay(name: K): void;
    reset(): void;
    /** destroy 清空已绑定的事件 */
    destroy(): void;
}
export declare const eventSubscribe: EventSubscribe<EventResultMap, string | number, any>;
