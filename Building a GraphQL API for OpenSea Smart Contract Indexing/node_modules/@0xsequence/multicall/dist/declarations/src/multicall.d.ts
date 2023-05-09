import { ethers } from 'ethers';
import { JsonRpcMethod } from './constants';
import { JsonRpcRequest, JsonRpcResponseCallback, JsonRpcHandlerFunc } from "@0xsequence/network";
export declare type MulticallOptions = {
    batchSize: number;
    timeWindow: number;
    contract: string;
    verbose: boolean;
};
export declare class Multicall {
    static DefaultOptions: {
        batchSize: number;
        timeWindow: number;
        contract: string;
        verbose: boolean;
    };
    readonly batchableJsonRpcMethods: JsonRpcMethod[];
    readonly multicallInterface: ethers.utils.Interface;
    options: MulticallOptions;
    constructor(options?: Partial<MulticallOptions>);
    private timeout;
    private queue;
    scheduleExecution: () => void;
    handle: (next: JsonRpcHandlerFunc, request: JsonRpcRequest, callback: JsonRpcResponseCallback) => void;
    run: () => Promise<void>;
    private forward;
    static isMulticall(cand: any): cand is Multicall;
    static isMulticallOptions(cand: any): cand is MulticallOptions;
}
