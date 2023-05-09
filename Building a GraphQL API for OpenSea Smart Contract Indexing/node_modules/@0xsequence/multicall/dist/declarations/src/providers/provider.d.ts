import { ethers, BigNumber } from 'ethers';
import { Deferrable } from '@ethersproject/properties';
import { Multicall, MulticallOptions } from '../multicall';
import { JsonRpcRequest, JsonRpcResponseCallback } from '@0xsequence/network';
export declare const ProxyMethods: string[];
export declare class MulticallProvider extends ethers.providers.BaseProvider {
    private provider;
    private multicall;
    constructor(provider: ethers.providers.Provider, multicall?: Multicall | Partial<MulticallOptions>);
    listenerCount: (eventName?: ethers.providers.EventType | undefined) => number;
    getResolver: (name: string | Promise<string>) => Promise<ethers.providers.Resolver | null>;
    next: (req: JsonRpcRequest, callback: JsonRpcResponseCallback) => Promise<void>;
    private callback;
    call(transaction: Deferrable<ethers.providers.TransactionRequest>, blockTag?: string | number | Promise<ethers.providers.BlockTag>): Promise<string>;
    getCode(addressOrName: string | Promise<string>, blockTag?: string | number | Promise<ethers.providers.BlockTag>): Promise<string>;
    getBalance(addressOrName: string | Promise<string>, blockTag?: string | number | Promise<ethers.providers.BlockTag>): Promise<BigNumber>;
    rpcCall(method: string, ...params: any[]): Promise<any>;
}
