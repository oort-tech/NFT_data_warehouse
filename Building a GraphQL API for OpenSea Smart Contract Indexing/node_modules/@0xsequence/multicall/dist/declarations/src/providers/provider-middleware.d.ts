import { Multicall, MulticallOptions } from '../multicall';
import { JsonRpcMiddleware } from '@0xsequence/network';
export declare const multicallMiddleware: (multicall?: Multicall | Partial<MulticallOptions> | undefined) => JsonRpcMiddleware;
