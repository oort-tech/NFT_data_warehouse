import { urlClean, logger } from '@0xsequence/utils';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function isNetworkConfig(cand) {
  return cand && cand.chainId !== undefined && cand.name !== undefined && cand.rpcUrl !== undefined && cand.relayer !== undefined;
}
const getChainId = chainId => {
  if (typeof chainId === 'number') {
    return chainId;
  }

  if (chainId.chainId) {
    return chainId.chainId;
  }

  return ethers.BigNumber.from(chainId).toNumber();
};
const maybeChainId = chainId => {
  if (!chainId) return undefined;
  return getChainId(chainId);
};
const getAuthNetwork = networks => {
  return networks.find(network => network.isAuthChain);
};
const isValidNetworkConfig = (networkConfig, raise = false, skipRelayerCheck = false) => {
  if (!networkConfig) throw new Error(`invalid network config: empty config`);
  const configs = [];

  if (Array.isArray(networkConfig)) {
    configs.push(...networkConfig);
  } else {
    configs.push(networkConfig);
  }

  if (configs.length === 0) {
    if (raise) throw new Error(`invalid network config: empty config`);
    return false;
  } // Ensure distinct chainId configs


  const chainIds = configs.map(c => c.chainId).sort();
  const dupes = chainIds.filter((c, i) => chainIds.indexOf(c) !== i);

  if (dupes.length > 0) {
    if (raise) throw new Error(`invalid network config: duplicate chainIds ${dupes}`);
    return false;
  } // Downcase all network names


  configs.forEach(c => c.name = c.name.toLowerCase()); // Ensure distinct network names

  const names = configs.map(c => c.name).sort();
  const nameDupes = names.filter((c, i) => names.indexOf(c) !== i);

  if (nameDupes.length > 0) {
    if (raise) throw new Error(`invalid network config: duplicate network names ${nameDupes}`);
    return false;
  } // Ensure rpcUrl or provider is specified
  // Ensure relayerUrl or relayer is specified
  // Ensure one default chain
  // Ensure one auth chain


  let defaultChain = false;
  let authChain = false;

  for (let i = 0; i < configs.length; i++) {
    const c = configs[i];

    if ((!c.rpcUrl || c.rpcUrl === '') && !c.provider) {
      if (raise) throw new Error(`invalid network config for chainId ${c.chainId}: rpcUrl or provider must be provided`);
      return false;
    }

    if (!skipRelayerCheck) {
      if (!c.relayer) {
        if (raise) throw new Error(`invalid network config for chainId ${c.chainId}: relayer must be provided`);
        return false;
      }
    }

    if (c.isDefaultChain) {
      if (defaultChain) {
        if (raise) throw new Error(`invalid network config for chainId ${c.chainId}: DefaultChain is already set by another config`);
        return false;
      }

      defaultChain = true;
    }

    if (c.isAuthChain) {
      if (authChain) {
        if (raise) throw new Error(`invalid network config for chainId ${c.chainId}: AuthChain is already set by another config`);
      }

      authChain = true;
    }
  }

  if (!defaultChain) {
    if (raise) throw new Error(`invalid network config: DefaultChain must be set`);
    return false;
  }

  if (!authChain) {
    if (raise) throw new Error(`invalid network config: AuthChain must be set`);
    return false;
  }

  return true;
};
const ensureValidNetworks = (networks, skipRelayerCheck = false) => {
  isValidNetworkConfig(networks, true, skipRelayerCheck);
  return networks;
};
const ensureUniqueNetworks = (networks, raise = true) => {
  const chainIds = networks.map(c => c.chainId).sort();
  const dupes = chainIds.filter((c, i) => chainIds.indexOf(c) !== i);

  if (dupes.length > 0) {
    if (raise) throw new Error(`invalid network config: duplicate chainIds ${dupes}`);
    return false;
  }

  return true;
};
const updateNetworkConfig = (src, dest) => {
  if (!src || !dest) return;

  if (!src.chainId && !src.name) {
    throw new Error('failed to update network config: source config is missing chainId or name');
  }

  if (src.chainId !== dest.chainId && src.name !== dest.name) {
    throw new Error('failed to update network config: one of chainId or name must match');
  }

  if (src.rpcUrl) {
    dest.rpcUrl = src.rpcUrl;
    dest.provider = undefined;
  }

  if (src.provider) {
    dest.provider = src.provider;
  }

  if (src.relayer) {
    dest.relayer = src.relayer;
  }

  if (src.ensAddress) {
    dest.ensAddress = src.ensAddress;
  } // NOTE: we do not set default or auth chain from here
  // if (src.isDefaultChain) {
  //   dest.isDefaultChain = src.isDefaultChain
  // }
  // if (src.isAuthChain) {
  //   dest.isAuthChain = src.isAuthChain
  // }

};
const createNetworkConfig = (networks, defaultChainId, vars) => {
  let config = [];

  if (typeof networks === 'function' && vars) {
    config = networks(vars);
  } else {
    config = networks;
  }

  if (defaultChainId) {
    config.forEach(n => n.isDefaultChain = false);
    const mainNetwork = config.filter(n => n.chainId === defaultChainId);

    if (!mainNetwork || mainNetwork.length === 0) {
      throw new Error(`defaultChainId ${defaultChainId} cannot be found in network list`);
    } else {
      mainNetwork[0].isDefaultChain = true;
    }
  }

  return ensureValidNetworks(sortNetworks(config));
};
const findNetworkConfig = (networks, chainId) => {
  if (typeof chainId === 'string') {
    if (chainId.startsWith('0x')) {
      const id = ethers.BigNumber.from(chainId).toNumber();
      return networks.find(n => n.chainId === id);
    } else {
      return networks.find(n => n.name === chainId);
    }
  } else if (typeof chainId === 'number') {
    return networks.find(n => n.chainId === chainId);
  } else if (chainId.chainId) {
    return networks.find(n => n.chainId === chainId.chainId);
  } else {
    return undefined;
  }
};
const checkNetworkConfig = (network, chainId) => {
  if (!network) return false;
  if (network.name === chainId) return true;
  if (network.chainId === chainId) return true;
  return false;
};
const networksIndex = networks => {
  const index = {};

  for (let i = 0; i < networks.length; i++) {
    index[networks[i].name] = networks[i];
  }

  return index;
}; // TODO: we should remove sortNetworks in the future but this is a breaking change for dapp integrations on older versions <-> wallet
// sortNetworks orders the network config list by: defaultChain, authChain, ..rest by chainId ascending numbers

const sortNetworks = networks => {
  if (!networks) {
    return [];
  }

  const config = networks.sort((a, b) => {
    if (a.chainId === b.chainId) return 0;
    return a.chainId < b.chainId ? -1 : 1;
  }); // DefaultChain goes first

  const defaultConfigIdx = config.findIndex(c => c.isDefaultChain);
  if (defaultConfigIdx > 0) config.splice(0, 0, config.splice(defaultConfigIdx, 1)[0]); // AuthChain goes second

  const authConfigIdx = config.findIndex(c => c.isAuthChain && c.isDefaultChain !== true);
  if (authConfigIdx > 0) config.splice(1, 0, config.splice(authConfigIdx, 1)[0]);
  return config;
};

let ChainId;

(function (ChainId) {
  ChainId[ChainId["MAINNET"] = 1] = "MAINNET";
  ChainId[ChainId["ROPSTEN"] = 3] = "ROPSTEN";
  ChainId[ChainId["RINKEBY"] = 4] = "RINKEBY";
  ChainId[ChainId["GOERLI"] = 5] = "GOERLI";
  ChainId[ChainId["KOVAN"] = 42] = "KOVAN";
  ChainId[ChainId["POLYGON"] = 137] = "POLYGON";
  ChainId[ChainId["POLYGON_MUMBAI"] = 80001] = "POLYGON_MUMBAI";
  ChainId[ChainId["BSC"] = 56] = "BSC";
  ChainId[ChainId["BSC_TESTNET"] = 97] = "BSC_TESTNET";
  ChainId[ChainId["OPTIMISM"] = 10] = "OPTIMISM";
  ChainId[ChainId["OPTIMISM_TESTNET"] = 69] = "OPTIMISM_TESTNET";
  ChainId[ChainId["ARBITRUM"] = 42161] = "ARBITRUM";
  ChainId[ChainId["ARBITRUM_TESTNET"] = 421611] = "ARBITRUM_TESTNET";
  ChainId[ChainId["AVALANCHE"] = 43114] = "AVALANCHE";
  ChainId[ChainId["AVALANCHE_TESTNET"] = 43113] = "AVALANCHE_TESTNET";
  ChainId[ChainId["FANTOM"] = 250] = "FANTOM";
  ChainId[ChainId["FANTOM_TESTNET"] = 4002] = "FANTOM_TESTNET";
  ChainId[ChainId["GNOSIS"] = 100] = "GNOSIS";
  ChainId[ChainId["AURORA"] = 1313161554] = "AURORA";
  ChainId[ChainId["AURORA_TESTNET"] = 1313161556] = "AURORA_TESTNET";
})(ChainId || (ChainId = {}));

const networks = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    name: 'mainnet',
    title: 'Ethereum',
    blockExplorer: {
      name: 'Etherscan',
      rootUrl: 'https://etherscan.io/'
    }
  },
  [ChainId.ROPSTEN]: {
    chainId: ChainId.ROPSTEN,
    name: 'ropsten',
    title: 'Ropsten',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Ropsten)',
      rootUrl: 'https://ropsten.etherscan.io/'
    }
  },
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    name: 'rinkeby',
    title: 'Rinkeby',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Rinkeby)',
      rootUrl: 'https://rinkeby.etherscan.io/'
    }
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    name: 'goerli',
    title: 'Goerli',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Goerli)',
      rootUrl: 'https://goerli.etherscan.io/'
    }
  },
  [ChainId.KOVAN]: {
    chainId: ChainId.KOVAN,
    name: 'kovan',
    title: 'Kovan',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Kovan)',
      rootUrl: 'https://kovan.etherscan.io/'
    }
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    name: 'polygon',
    title: 'Polygon',
    blockExplorer: {
      name: 'Polygonscan',
      rootUrl: 'https://polygonscan.com/'
    }
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    name: 'mumbai',
    title: 'Polygon Mumbai',
    testnet: true,
    blockExplorer: {
      name: 'Polygonscan (Mumbai)',
      rootUrl: 'https://mumbai.polygonscan.com/'
    }
  },
  [ChainId.BSC]: {
    chainId: ChainId.BSC,
    name: 'bsc',
    title: 'BNB Smart Chain',
    blockExplorer: {
      name: 'BSCScan',
      rootUrl: 'https://bscscan.com/'
    }
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    name: 'bsc-testnet',
    title: 'BNB Smart Chain Testnet',
    testnet: true,
    blockExplorer: {
      name: 'BSCScan (Testnet)',
      rootUrl: 'https://testnet.bscscan.com/'
    }
  },
  [ChainId.OPTIMISM]: {
    chainId: ChainId.OPTIMISM,
    name: 'optimism',
    title: 'Optimism',
    blockExplorer: {
      name: 'Etherscan (Optimism)',
      rootUrl: 'https://optimistic.etherscan.io/'
    }
  },
  [ChainId.OPTIMISM_TESTNET]: {
    chainId: ChainId.OPTIMISM_TESTNET,
    name: 'optimism-testnet',
    title: 'Optimistic Kovan',
    testnet: true,
    blockExplorer: {
      name: 'Etherscan (Optimism Testnet)',
      rootUrl: 'https://kovan-optimistic.etherscan.io/'
    }
  },
  [ChainId.ARBITRUM]: {
    chainId: ChainId.ARBITRUM,
    name: 'arbitrum',
    title: 'Arbitrum',
    blockExplorer: {
      name: 'Arbiscan',
      rootUrl: 'https://arbiscan.io/'
    }
  },
  [ChainId.ARBITRUM_TESTNET]: {
    chainId: ChainId.ARBITRUM_TESTNET,
    name: 'arbitrum-testnet',
    title: 'Arbitrum Testnet',
    testnet: true,
    blockExplorer: {
      name: 'Arbiscan (Testnet)',
      rootUrl: 'https://testnet.arbiscan.io/'
    }
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    name: 'avalanche',
    title: 'Avalanche',
    blockExplorer: {
      name: 'Snowtrace',
      rootUrl: 'https://snowtrace.io/'
    }
  },
  [ChainId.AVALANCHE_TESTNET]: {
    chainId: ChainId.AVALANCHE_TESTNET,
    name: 'avalanche-testnet',
    title: 'Avalanche Testnet',
    testnet: true,
    blockExplorer: {
      name: 'Snowtrace (Testnet)',
      rootUrl: 'https://testnet.snowtrace.io/'
    }
  },
  [ChainId.FANTOM]: {
    chainId: ChainId.FANTOM,
    name: 'fantom',
    title: 'Fantom',
    blockExplorer: {
      name: 'FTMScan',
      rootUrl: 'https://ftmscan.com/'
    }
  },
  [ChainId.FANTOM_TESTNET]: {
    chainId: ChainId.FANTOM_TESTNET,
    name: 'fantom-testnet',
    title: 'Fantom Testnet',
    testnet: true,
    blockExplorer: {
      name: 'FTMScan (Testnet)',
      rootUrl: 'https://testnet.ftmscan.com/'
    }
  },
  [ChainId.GNOSIS]: {
    chainId: ChainId.GNOSIS,
    name: 'gnosis',
    title: 'Gnosis Chain',
    blockExplorer: {
      name: 'Gnosis Chain Explorer',
      rootUrl: 'https://blockscout.com/xdai/mainnet/'
    }
  },
  [ChainId.AURORA]: {
    chainId: ChainId.AURORA,
    name: 'aurora',
    title: 'Aurora',
    blockExplorer: {
      name: 'Aurora Explorer',
      rootUrl: 'https://aurorascan.dev/'
    }
  },
  [ChainId.AURORA_TESTNET]: {
    chainId: ChainId.AURORA_TESTNET,
    name: 'aurora-testnet',
    title: 'Aurora Testnet',
    blockExplorer: {
      name: 'Aurora Explorer (Testnet)',
      rootUrl: 'https://testnet.aurorascan.dev/'
    }
  }
};
const mainnetNetworks = createNetworkConfig(vars => [_extends({}, networks[ChainId.MAINNET], {
  ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  rpcUrl: urlClean(`${vars.baseRpcUrl}/mainnet`),
  relayer: {
    url: urlClean(`${vars.baseRelayerUrl}/mainnet`)
  },
  isDefaultChain: true
}), _extends({}, networks[ChainId.POLYGON], {
  rpcUrl: 'https://rpc-mainnet.matic.network',
  relayer: {
    url: urlClean(`${vars.baseRelayerUrl}/matic`)
  },
  isAuthChain: true
})], 1, {
  baseRpcUrl: 'https://nodes.sequence.app',
  baseRelayerUrl: 'https://relayers.sequence.app'
});
const testnetNetworks = createNetworkConfig(vars => [_extends({}, networks[ChainId.RINKEBY], {
  ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  rpcUrl: urlClean(`${vars.baseRpcUrl}/rinkeby`),
  relayer: {
    url: urlClean(`${vars.baseRelayerUrl}/rinkeby`)
  },
  isDefaultChain: true
}), _extends({}, networks[ChainId.GOERLI], {
  ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  rpcUrl: urlClean(`${vars.baseRpcUrl}/goerli`),
  relayer: {
    url: urlClean(`${vars.baseRelayerUrl}/goerli`)
  },
  isAuthChain: true
})], undefined, {
  baseRpcUrl: 'https://nodes.sequence.app',
  baseRelayerUrl: 'https://relayers.sequence.app'
});

// WalletContext is the module addresses deployed on a network, aka the context / environment
// of the Sequence Smart Wallet system on Ethereum.
// sequenceContext are the deployed addresses of modules available on public networks.
const sequenceContext = {
  factory: '0xf9D09D634Fb818b05149329C1dcCFAeA53639d96',
  mainModule: '0xd01F11855bCcb95f88D7A48492F66410d4637313',
  mainModuleUpgradable: '0x7EFE6cE415956c5f80C6530cC6cc81b4808F6118',
  guestModule: '0x02390F3E6E5FD1C6786CB78FD3027C117a9955A7',
  sequenceUtils: '0xd130B43062D875a4B7aF3f8fc036Bc6e9D3E1B3E',
  libs: {
    requireFreshSigner: '0xE6B9B21C077F382333220a072e4c44280b873907'
  }
};

const JsonRpcVersion = '2.0';

class JsonRpcRouter {
  constructor(middlewares, sender) {
    this.sender = void 0;
    this.handler = void 0;
    this.sender = sender;

    if (middlewares) {
      this.setMiddleware(middlewares);
    }
  }

  setMiddleware(middlewares) {
    this.handler = createJsonRpcMiddlewareStack(middlewares, this.sender.sendAsync);
  }

  sendAsync(request, callback, chainId) {
    try {
      this.handler(request, callback, chainId);
    } catch (err) {
      callback(err, undefined);
    }
  } // createWeb3Provider(network?: Networkish): EthersWeb3Provider {
  //   return new EthersWeb3Provider(this.sender, network)
  // }


}
const createJsonRpcMiddlewareStack = (middlewares, handler) => {
  if (middlewares.length === 0) return handler;

  const toMiddleware = v => {
    if (v.sendAsyncMiddleware) {
      return v.sendAsyncMiddleware;
    } else {
      return v;
    }
  };

  let chain;
  chain = toMiddleware(middlewares[middlewares.length - 1])(handler);

  for (let i = middlewares.length - 2; i >= 0; i--) {
    chain = toMiddleware(middlewares[i])(chain);
  }

  return chain;
};

function isJsonRpcProvider(cand) {
  return cand !== undefined && cand.send !== undefined && cand.constructor.defaultUrl !== undefined && cand.detectNetwork !== undefined && cand.getSigner !== undefined && cand.perform !== undefined;
}
function isJsonRpcHandler(cand) {
  return cand !== undefined && cand.sendAsync !== undefined;
}

let _nextId = 0;
class JsonRpcSender {
  constructor(provider, defaultChainId) {
    this.send = void 0;
    this.request = void 0;
    this.defaultChainId = void 0;

    this.sendAsync = (request, callback, chainId) => {
      this.send(request.method, request.params, chainId || this.defaultChainId).then(r => {
        callback(undefined, {
          jsonrpc: '2.0',
          id: request.id,
          result: r
        });
      }).catch(e => {
        callback(e, undefined);
      });
    };

    this.defaultChainId = defaultChainId;

    if (isJsonRpcProvider(provider)) {
      // we can ignore defaultChainId for JsonRpcProviders as they are already chain-bound
      this.send = provider.send.bind(provider);
    } else if (isJsonRpcHandler(provider)) {
      this.send = (method, params, chainId) => {
        return new Promise((resolve, reject) => {
          provider.sendAsync({
            // TODO: really shouldn't have to set these here?
            jsonrpc: JsonRpcVersion,
            id: ++_nextId,
            method,
            params
          }, (error, response) => {
            if (error) {
              reject(error);
            } else if (response) {
              resolve(response.result);
            } else {
              resolve(undefined);
            }
          }, chainId || this.defaultChainId);
        });
      };
    } else {
      this.send = provider;
    }

    this.request = (request, chainId) => {
      return this.send(request.method, request.params, chainId);
    };
  }

}
class JsonRpcExternalProvider {
  constructor(provider) {
    this.provider = provider;

    this.sendAsync = (request, callback) => {
      this.provider.send(request.method, request.params).then(r => {
        callback(undefined, {
          jsonrpc: '2.0',
          id: request.id,
          result: r
        });
      }).catch(e => {
        callback(e, undefined);
      });
    };

    this.send = this.sendAsync;
  }

}

class AllowProvider {
  constructor(isAllowedFunc) {
    this.sendAsyncMiddleware = void 0;
    this.isAllowedFunc = void 0;

    if (isAllowedFunc) {
      this.isAllowedFunc = isAllowedFunc;
    } else {
      this.isAllowedFunc = request => true;
    }

    this.sendAsyncMiddleware = allowProviderMiddleware(this.isAllowedFunc);
  }

  setIsAllowedFunc(fn) {
    this.isAllowedFunc = fn;
    this.sendAsyncMiddleware = allowProviderMiddleware(this.isAllowedFunc);
  }

}
const allowProviderMiddleware = isAllowed => next => {
  return (request, callback, chainId) => {
    // ensure precondition is met or do not allow the request to continue
    if (!isAllowed(request)) {
      throw new Error('allowProvider middleware precondition is unmet.');
    } // request is allowed. keep going..


    next(request, callback, chainId);
  };
};

class CachedProvider {
  constructor(defaultChainId) {
    this.cachableJsonRpcMethods = ['net_version', 'eth_chainId', 'eth_accounts', 'sequence_getWalletContext', 'sequence_getNetworks'];
    this.cache = void 0;
    this.onUpdateCallback = void 0;
    this.defaultChainId = void 0;

    this.sendAsyncMiddleware = next => {
      return (request, callback, chainId) => {
        // Respond early with cached result
        if (this.cachableJsonRpcMethods.includes(request.method)) {
          const key = this.cacheKey(request.method, request.params, chainId || this.defaultChainId);
          const result = this.getCacheValue(key);

          if (result && result !== '') {
            callback(undefined, {
              jsonrpc: '2.0',
              id: request.id,
              result: result
            });
            return;
          }
        } // Continue down the handler chain


        next(request, (error, response, chainId) => {
          // Store result in cache and continue
          if (this.cachableJsonRpcMethods.includes(request.method)) {
            if (response && response.result) {
              const key = this.cacheKey(request.method, request.params, chainId || this.defaultChainId);
              this.setCacheValue(key, response.result);
            }
          } // Exec next handler


          callback(error, response);
        }, chainId || this.defaultChainId);
      };
    };

    this.cacheKey = (method, params, chainId) => {
      let key = '';

      if (chainId) {
        key = `${chainId}:${method}:`;
      } else {
        key = `:${method}:`;
      }

      if (!params || params.length === 0) {
        return key + '[]';
      }

      return key + JSON.stringify(params);
    };

    this.getCache = () => this.cache;

    this.setCache = cache => {
      this.cache = cache;

      if (this.onUpdateCallback) {
        this.onUpdateCallback();
      }
    };

    this.getCacheValue = key => {
      return this.cache[key];
    };

    this.setCacheValue = (key, value) => {
      this.cache[key] = value;

      if (this.onUpdateCallback) {
        this.onUpdateCallback(key, value);
      }
    };

    this.clearCache = () => {
      this.cache = {};
    };

    this.cache = {};
    this.defaultChainId = defaultChainId;
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback;
  }

}

class EagerProvider {
  constructor(props) {
    this.props = void 0;

    this.sendAsyncMiddleware = next => {
      return (request, callback, chainId) => {
        const {
          id,
          method
        } = request;

        switch (method) {
          case 'net_version':
            if (this.props.chainId) {
              callback(undefined, {
                jsonrpc: '2.0',
                id: id,
                result: `${this.props.chainId}`
              });
              return;
            }

            break;

          case 'eth_chainId':
            if (this.props.chainId) {
              callback(undefined, {
                jsonrpc: '2.0',
                id: id,
                result: ethers.utils.hexlify(this.props.chainId)
              });
              return;
            }

            break;

          case 'eth_accounts':
            if (this.props.accountAddress) {
              callback(undefined, {
                jsonrpc: '2.0',
                id: id,
                result: [ethers.utils.getAddress(this.props.accountAddress)]
              });
              return;
            }

            break;

          case 'sequence_getWalletContext':
            if (this.props.walletContext) {
              callback(undefined, {
                jsonrpc: '2.0',
                id: id,
                result: this.props.walletContext
              });
              return;
            }

            break;
        }

        next(request, callback, chainId);
      };
    };

    this.props = props;
  }

}

const exceptionProviderMiddleware = next => {
  return (request, callback, chainId) => {
    next(request, (error, response) => {
      if (!error && response && response.error) {
        if (typeof response.error === 'string') {
          throw new Error(response.error);
        } else {
          throw new Error(response.error.message);
        }
      }

      callback(error, response);
    }, chainId);
  };
};

const loggingProviderMiddleware = next => {
  return (request, callback, chainId) => {
    const chainIdLabel = chainId ? ` chainId:${chainId}` : '';
    logger.info(`[provider request]${chainIdLabel} id:${request.id} method:${request.method} params:`, request.params);
    next(request, (error, response) => {
      if (error) {
        logger.warn(`[provider response]${chainIdLabel} id:${request.id} method:${request.method} params:`, request.params, `error:`, error);
      } else {
        logger.info(`[provider response]${chainIdLabel} id:${request.id} method:${request.method} params:`, request.params, `response:`, response);
      }

      callback(error, response);
    }, chainId);
  };
};

const networkProviderMiddleware = getChainId => next => {
  return (request, callback, chainId) => {
    const networkChainId = getChainId(request);
    const {
      id,
      method
    } = request;

    switch (method) {
      case 'net_version':
        callback(undefined, {
          jsonrpc: '2.0',
          id: id,
          result: `${networkChainId}`
        });
        return;

      case 'eth_chainId':
        callback(undefined, {
          jsonrpc: '2.0',
          id: id,
          result: ethers.utils.hexlify(networkChainId)
        });
        return;
    } // request is allowed. keep going..


    next(request, callback, chainId);
  };
};

const SignerJsonRpcMethods = ['personal_sign', 'eth_sign', 'eth_signTypedData', 'eth_signTypedData_v4', 'eth_sendTransaction', 'eth_sendRawTransaction', 'sequence_getWalletContext', 'sequence_getWalletConfig', 'sequence_getWalletState', 'sequence_getNetworks', 'sequence_updateConfig', 'sequence_publishConfig', 'sequence_estimateGasLimits', 'sequence_gasRefundOptions', 'sequence_getNonce', 'sequence_relay', 'eth_decrypt', 'eth_getEncryptionPublicKey', 'wallet_addEthereumChain', 'wallet_switchEthereumChain', 'wallet_registerOnboarding', 'wallet_watchAsset', 'wallet_scanQRCode'];
class SigningProvider {
  constructor(provider) {
    this.provider = void 0;

    this.sendAsyncMiddleware = next => {
      return (request, callback, chainId) => {
        // Forward signing requests to the signing provider
        if (SignerJsonRpcMethods.includes(request.method)) {
          this.provider.sendAsync(request, callback, chainId);
          return;
        } // Continue to next handler


        next(request, callback, chainId);
      };
    };

    this.provider = provider;
  }

}

class PublicProvider {
  constructor(rpcUrl) {
    this.privateJsonRpcMethods = ['net_version', 'eth_chainId', 'eth_accounts', ...SignerJsonRpcMethods];
    this.provider = void 0;
    this.rpcUrl = void 0;

    this.sendAsyncMiddleware = next => {
      return (request, callback) => {
        // When provider is configured, send non-private methods to our local public provider
        if (this.provider && !this.privateJsonRpcMethods.includes(request.method)) {
          this.provider.send(request.method, request.params).then(r => {
            callback(undefined, {
              jsonrpc: '2.0',
              id: request.id,
              result: r
            });
          }).catch(e => callback(e));
          return;
        } // Continue to next handler


        logger.debug('[public-provider] sending request to signer window', request.method);
        next(request, callback);
      };
    };

    if (rpcUrl) {
      this.setRpcUrl(rpcUrl);
    }
  }

  getRpcUrl() {
    return this.rpcUrl;
  }

  setRpcUrl(rpcUrl) {
    if (!rpcUrl || rpcUrl === '') {
      this.rpcUrl = undefined;
      this.provider = undefined;
    } else {
      this.rpcUrl = rpcUrl;
      this.provider = new JsonRpcProvider(rpcUrl);
    }
  }

}

export { AllowProvider, CachedProvider, ChainId, EagerProvider, JsonRpcExternalProvider, JsonRpcRouter, JsonRpcSender, JsonRpcVersion, PublicProvider, SigningProvider, allowProviderMiddleware, checkNetworkConfig, createJsonRpcMiddlewareStack, createNetworkConfig, ensureUniqueNetworks, ensureValidNetworks, exceptionProviderMiddleware, findNetworkConfig, getAuthNetwork, getChainId, isJsonRpcHandler, isJsonRpcProvider, isNetworkConfig, isValidNetworkConfig, loggingProviderMiddleware, mainnetNetworks, maybeChainId, networkProviderMiddleware, networks, networksIndex, sequenceContext, sortNetworks, testnetNetworks, updateNetworkConfig };
