import { BigNumberish } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Indexer } from '@0xsequence/indexer';
import { Relayer, RpcRelayerOptions } from '@0xsequence/relayer';
export declare enum ChainId {
    MAINNET = 1,
    ROPSTEN = 3,
    RINKEBY = 4,
    GOERLI = 5,
    KOVAN = 42,
    POLYGON = 137,
    POLYGON_MUMBAI = 80001,
    BSC = 56,
    BSC_TESTNET = 97,
    OPTIMISM = 10,
    OPTIMISM_TESTNET = 69,
    ARBITRUM = 42161,
    ARBITRUM_TESTNET = 421611,
    AVALANCHE = 43114,
    AVALANCHE_TESTNET = 43113,
    FANTOM = 250,
    FANTOM_TESTNET = 4002,
    GNOSIS = 100,
    AURORA = 1313161554,
    AURORA_TESTNET = 1313161556
}
export interface NetworkConfig {
    title?: string;
    name: string;
    chainId: number;
    ensAddress?: string;
    testnet?: boolean;
    blockExplorer?: BlockExplorerConfig;
    rpcUrl?: string;
    provider?: JsonRpcProvider;
    indexerUrl?: string;
    indexer?: Indexer;
    relayer?: Relayer | RpcRelayerOptions;
    isDefaultChain?: boolean;
    isAuthChain?: boolean;
}
export declare type BlockExplorerConfig = {
    name?: string;
    rootUrl: string;
    addressUrl?: string;
    txnHashUrl?: string;
};
export declare const networks: Record<ChainId, NetworkConfig>;
export declare type ChainIdLike = NetworkConfig | BigNumberish;
export declare type NetworksBuilder = (vars: {
    [key: string]: any;
}) => NetworkConfig[];
export declare const mainnetNetworks: NetworkConfig[];
export declare const testnetNetworks: NetworkConfig[];
