import { JsonRpcHandlerFunc, JsonRpcRequest, JsonRpcResponseCallback, JsonRpcMiddlewareHandler } from '../types';
export declare class CachedProvider implements JsonRpcMiddlewareHandler {
    private cachableJsonRpcMethods;
    private cache;
    private onUpdateCallback?;
    readonly defaultChainId?: number;
    constructor(defaultChainId?: number);
    sendAsyncMiddleware: (next: JsonRpcHandlerFunc) => (request: JsonRpcRequest, callback: JsonRpcResponseCallback, chainId?: number | undefined) => void;
    cacheKey: (method: string, params: any[], chainId?: number | undefined) => string;
    getCache: () => {
        [key: string]: any;
    };
    setCache: (cache: {
        [key: string]: any;
    }) => void;
    getCacheValue: (key: string) => any;
    setCacheValue: (key: string, value: any) => void;
    onUpdate(callback: (key?: string, value?: any) => void): void;
    clearCache: () => void;
}
