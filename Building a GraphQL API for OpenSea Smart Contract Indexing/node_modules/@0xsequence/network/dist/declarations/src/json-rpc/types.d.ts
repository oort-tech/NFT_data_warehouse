import { ProviderRpcError } from '@0xsequence/provider';
export declare const JsonRpcVersion = "2.0";
export interface JsonRpcRequest {
    jsonrpc?: string;
    id?: number;
    method: string;
    params?: any[];
}
export interface JsonRpcResponse {
    jsonrpc: string;
    id: number;
    result: any;
    error?: ProviderRpcError;
}
export declare type JsonRpcResponseCallback = (error?: ProviderRpcError, response?: JsonRpcResponse) => void;
export declare type JsonRpcHandlerFunc = (request: JsonRpcRequest, callback: JsonRpcResponseCallback, chainId?: number) => void;
export interface JsonRpcHandler {
    sendAsync: JsonRpcHandlerFunc;
}
export declare type JsonRpcFetchFunc = (method: string, params?: any[], chainId?: number) => Promise<any>;
export declare type JsonRpcRequestFunc = (request: {
    method: string;
    params?: any[];
}, chainId?: number) => Promise<any>;
export declare type JsonRpcMiddleware = (next: JsonRpcHandlerFunc) => JsonRpcHandlerFunc;
export interface JsonRpcMiddlewareHandler {
    sendAsyncMiddleware: JsonRpcMiddleware;
}
