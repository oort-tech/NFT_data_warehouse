import { JsonRpcProvider, ExternalProvider } from '@ethersproject/providers';
import { JsonRpcRequest, JsonRpcResponseCallback, JsonRpcHandler, JsonRpcFetchFunc, JsonRpcRequestFunc } from './types';
export declare class JsonRpcSender implements JsonRpcHandler {
    readonly send: JsonRpcFetchFunc;
    readonly request: JsonRpcRequestFunc;
    readonly defaultChainId?: number;
    constructor(provider: JsonRpcProvider | JsonRpcHandler | JsonRpcFetchFunc, defaultChainId?: number);
    sendAsync: (request: JsonRpcRequest, callback: JsonRpcResponseCallback | ((error: any, response: any) => void), chainId?: number | undefined) => void;
}
export declare class JsonRpcExternalProvider implements ExternalProvider, JsonRpcHandler {
    private provider;
    constructor(provider: JsonRpcProvider);
    sendAsync: (request: JsonRpcRequest, callback: JsonRpcResponseCallback | ((error: any, response: any) => void)) => void;
    send: (request: JsonRpcRequest, callback: JsonRpcResponseCallback | ((error: any, response: any) => void)) => void;
}
