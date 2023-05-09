import { JsonRpcProvider } from '@ethersproject/providers';
import { JsonRpcHandler } from './types';
export declare function isJsonRpcProvider(cand: any): cand is JsonRpcProvider;
export declare function isJsonRpcHandler(cand: any): cand is JsonRpcHandler;
