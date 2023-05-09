export interface WalletContext {
    factory: string;
    mainModule: string;
    mainModuleUpgradable: string;
    guestModule?: string;
    sequenceUtils?: string;
    libs?: {
        requireFreshSigner?: string;
    };
    nonStrict?: boolean;
}
export declare const sequenceContext: WalletContext;
