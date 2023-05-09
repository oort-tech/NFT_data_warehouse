import { JsonRpcHandlerFunc, JsonRpcRequest, JsonRpcResponseCallback, JsonRpcMiddlewareHandler } from '../types';
import { WalletContext } from '../../context';
export declare type EagerProviderProps = {
    accountAddress?: string;
    chainId?: number;
    walletContext?: WalletContext;
};
export declare class EagerProvider implements JsonRpcMiddlewareHandler {
    readonly props: EagerProviderProps;
    constructor(props: EagerProviderProps);
    sendAsyncMiddleware: (next: JsonRpcHandlerFunc) => (request: JsonRpcRequest, callback: JsonRpcResponseCallback, chainId?: number | undefined) => void;
}
