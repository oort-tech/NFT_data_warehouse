import * as erc1271 from './erc1271';
import * as factory from './factory';
import * as mainModule from './mainModule';
import * as mainModuleUpgradable from './mainModuleUpgradable';
import * as sequenceUtils from './sequenceUtils';
import * as requireFreshSigner from './libs/requireFreshSigners';
export declare const walletContracts: {
    erc1271: typeof erc1271;
    factory: typeof factory;
    mainModule: typeof mainModule;
    mainModuleUpgradable: typeof mainModuleUpgradable;
    sequenceUtils: typeof sequenceUtils;
    requireFreshSigner: typeof requireFreshSigner;
};
