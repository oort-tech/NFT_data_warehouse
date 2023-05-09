import { JsonRpcHandlerFunc, JsonRpcRequest, JsonRpcResponseCallback, JsonRpcMiddlewareHandler, JsonRpcHandler } from '../types';
export declare const SignerJsonRpcMethods: string[];
export declare class SigningProvider implements JsonRpcMiddlewareHandler {
    private provider;
    constructor(provider: JsonRpcHandler);
    sendAsyncMiddleware: (next: JsonRpcHandlerFunc) => (request: JsonRpcRequest, callback: JsonRpcResponseCallback, chainId?: number | undefined) => void;
}
