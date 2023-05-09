import { JsonRpcHandlerFunc, JsonRpcRequest, JsonRpcResponseCallback, JsonRpcMiddlewareHandler } from '../types';
export declare class PublicProvider implements JsonRpcMiddlewareHandler {
    private privateJsonRpcMethods;
    private provider?;
    private rpcUrl?;
    constructor(rpcUrl?: string);
    sendAsyncMiddleware: (next: JsonRpcHandlerFunc) => (request: JsonRpcRequest, callback: JsonRpcResponseCallback) => void;
    getRpcUrl(): string | undefined;
    setRpcUrl(rpcUrl: string): void;
}
