import { JsonRpcRequest, JsonRpcMiddleware } from '../types';
export declare const networkProviderMiddleware: (getChainId: (request: JsonRpcRequest) => number) => JsonRpcMiddleware;
