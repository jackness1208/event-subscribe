/** 事件 hooks */
export interface EventResultMap {
    [eventName: string]: any;
}
export interface EventFnMap {
    [eventName: string]: ((rs: any) => void)[];
}
/** 事件回调 */
export declare type EventCallback<R = any> = (rs: R) => void;
export declare const eventSubscribe: {
    /**
     * 事件订阅
     * @param name: 事件名称
     * @param callback: 回调方法
     * @param immediate: 若订阅之前已经触发过，是否马上执行
     * @param fnKey: 用于去掉订阅时标识
     * @returns eventKey 订阅标识, 用于 off
     * */
    on<R = any>(name: string, callback: EventCallback<R>, immediate?: boolean | undefined, fnKey?: string | undefined): string;
    /**
     * 事件退订
     * @param name: 事件名称
     * @param ctx: 订阅时方法 | 订阅标识
     * */
    off<R_1 = any>(name: string, ctx: string | EventCallback<R_1>): void;
    /**
     * 事件广播
     * @param name: 事件名称
     * @param data: 入参数据
     * */
    trigger<R_2 = any>(name: string, data: R_2): void;
    /**
     * 事件回放
     * @param name: 事件名称
     * */
    replay(name: string): void;
    /** reset 清空已绑定的事件 */
    reset(): void;
};
