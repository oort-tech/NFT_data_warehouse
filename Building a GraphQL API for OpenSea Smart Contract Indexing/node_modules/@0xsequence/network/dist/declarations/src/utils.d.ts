import { ChainIdLike } from '.';
import { NetworkConfig, NetworksBuilder } from './config';
export declare function isNetworkConfig(cand: any): cand is NetworkConfig;
export declare const getChainId: (chainId: ChainIdLike) => number;
export declare const maybeChainId: (chainId?: ChainIdLike | undefined) => number | undefined;
export declare const getAuthNetwork: (networks: NetworkConfig[]) => NetworkConfig | undefined;
export declare const isValidNetworkConfig: (networkConfig: NetworkConfig | NetworkConfig[], raise?: boolean, skipRelayerCheck?: boolean) => boolean;
export declare const ensureValidNetworks: (networks: NetworkConfig[], skipRelayerCheck?: boolean) => NetworkConfig[];
export declare const ensureUniqueNetworks: (networks: NetworkConfig[], raise?: boolean) => boolean;
export declare const updateNetworkConfig: (src: Partial<NetworkConfig>, dest: NetworkConfig) => void;
export declare const createNetworkConfig: (networks: NetworkConfig[] | NetworksBuilder, defaultChainId?: number | undefined, vars?: {
    [key: string]: any;
} | undefined) => NetworkConfig[];
export declare const findNetworkConfig: (networks: NetworkConfig[], chainId: ChainIdLike) => NetworkConfig | undefined;
export declare const checkNetworkConfig: (network: NetworkConfig, chainId: string | number) => boolean;
export declare const networksIndex: (networks: NetworkConfig[]) => {
    [key: string]: NetworkConfig;
};
export declare const sortNetworks: (networks: NetworkConfig[]) => NetworkConfig[];
