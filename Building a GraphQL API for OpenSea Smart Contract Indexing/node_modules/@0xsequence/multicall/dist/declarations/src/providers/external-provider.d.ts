import { ExternalProvider } from '@ethersproject/providers';
import { Multicall, MulticallOptions } from '../multicall';
export declare class MulticallExternalProvider implements ExternalProvider {
    private provider;
    private multicall;
    constructor(provider: ExternalProvider, multicall?: Multicall | Partial<MulticallOptions>);
    get isMetaMask(): boolean | undefined;
    get isStatus(): boolean | undefined;
}
