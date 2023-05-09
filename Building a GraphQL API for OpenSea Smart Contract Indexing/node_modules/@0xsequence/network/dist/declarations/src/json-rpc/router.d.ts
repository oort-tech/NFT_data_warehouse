import { JsonRpcHandlerFunc, JsonRpcRequest, JsonRpcResponseCallback, JsonRpcHandler, JsonRpcMiddleware, JsonRpcMiddlewareHandler } from './types';
export declare class JsonRpcRouter implements JsonRpcHandler {
    private sender;
    private handler;
    constructor(middlewares: Array<JsonRpcMiddleware | JsonRpcMiddlewareHandler>, sender: JsonRpcHandler);
    setMiddleware(middlewares: Array<JsonRpcMiddleware | JsonRpcMiddlewareHandler>): void;
    sendAsync(request: JsonRpcRequest, callback: JsonRpcResponseCallback, chainId?: number): void;
}
export declare const createJsonRpcMiddlewareStack: (middlewares: Array<JsonRpcMiddleware | JsonRpcMiddlewareHandler>, handler: JsonRpcHandlerFunc) => JsonRpcHandlerFunc;
