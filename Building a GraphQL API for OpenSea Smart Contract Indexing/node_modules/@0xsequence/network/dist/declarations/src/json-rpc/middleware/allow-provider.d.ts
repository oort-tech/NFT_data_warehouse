import { JsonRpcRequest, JsonRpcMiddleware, JsonRpcMiddlewareHandler } from '../types';
export declare class AllowProvider implements JsonRpcMiddlewareHandler {
    sendAsyncMiddleware: JsonRpcMiddleware;
    private isAllowedFunc;
    constructor(isAllowedFunc?: (request: JsonRpcRequest) => boolean);
    setIsAllowedFunc(fn: (request: JsonRpcRequest) => boolean): void;
}
export declare const allowProviderMiddleware: (isAllowed: (request: JsonRpcRequest) => boolean) => JsonRpcMiddleware;
