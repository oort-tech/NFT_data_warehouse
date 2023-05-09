'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsBase64 = require('js-base64');
var ethers = require('ethers');
var properties = require('@ethersproject/properties');
var utils = require('ethers/lib/utils');

const base64Encode = val => {
  return jsBase64.Base64.encode(val, true);
};
const base64EncodeObject = obj => {
  return jsBase64.Base64.encode(JSON.stringify(obj), true);
};
const base64Decode = encodedString => {
  if (encodedString === null || encodedString === undefined) {
    return undefined;
  }

  return jsBase64.Base64.decode(encodedString);
};
const base64DecodeObject = encodedObject => {
  if (encodedObject === null || encodedObject === undefined) {
    return undefined;
  }

  return JSON.parse(jsBase64.Base64.decode(encodedObject));
};

const encodeMessageDigest = message => {
  if (typeof message === 'string') {
    return ethers.ethers.utils.arrayify(ethers.ethers.utils.keccak256(ethers.ethers.utils.toUtf8Bytes(message)));
  } else {
    return ethers.ethers.utils.arrayify(ethers.ethers.utils.keccak256(message));
  }
}; // packMessageData encodes the specified data ready for the Sequence Wallet contracts.

const packMessageData = (walletAddress, chainId, digest) => {
  return ethers.ethers.utils.solidityPack(['string', 'uint256', 'address', 'bytes32'], ['\x19\x01', chainId, walletAddress, digest]);
};
const subDigestOf = (address, chainId, digest) => {
  return ethers.ethers.utils.keccak256(packMessageData(address, chainId, digest));
};

const isNode = () => {
  if (typeof window === 'undefined' && typeof process === 'object') {
    return true;
  } else {
    return false;
  }
};
const isBrowser = () => !isNode();

const jwtDecodeClaims = jwt => {
  const parts = jwt.split('.');

  if (parts.length !== 3) {
    throw new Error('invalid jwt');
  }

  const claims = JSON.parse(jsBase64.Base64.decode(parts[1]));
  return claims;
};

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

var logLevel;

(function (logLevel) {
  logLevel[logLevel["DEBUG"] = 1] = "DEBUG";
  logLevel[logLevel["INFO"] = 2] = "INFO";
  logLevel[logLevel["WARN"] = 3] = "WARN";
  logLevel[logLevel["ERROR"] = 4] = "ERROR";
  logLevel[logLevel["DISABLED"] = 5] = "DISABLED";
})(logLevel || (logLevel = {}));

class Logger {
  constructor(config) {
    this.config = config;
    this.logLevel = void 0;
    this.configure(config);
  }

  configure(config) {
    this.config = _extends({}, this.config, config);

    switch (this.config.logLevel) {
      case 'DEBUG':
        this.logLevel = logLevel.DEBUG;
        break;

      case 'INFO':
        this.logLevel = logLevel.INFO;
        break;

      case 'WARN':
        this.logLevel = logLevel.WARN;
        break;

      case 'ERROR':
        this.logLevel = logLevel.ERROR;
        break;

      case 'DISABLED':
        this.logLevel = logLevel.DISABLED;
        break;

      default:
        this.logLevel = logLevel.INFO;
        break;
    } // undefined silence value will disable the default silence flag


    if (this.config.silence === undefined) {
      this.config.silence = false;
    }
  }

  debug(message, ...optionalParams) {
    if (this.config.silence === true) return;

    if (this.logLevel === logLevel.DEBUG) {
      console.log(message, ...optionalParams);
    }
  }

  info(message, ...optionalParams) {
    if (this.config.silence === true) return;

    if (this.logLevel <= logLevel.INFO) {
      console.log(message, ...optionalParams);
    }
  }

  warn(message, ...optionalParams) {
    if (this.config.silence === true) return;

    if (this.logLevel <= logLevel.WARN) {
      console.warn(message, ...optionalParams);

      if (this.config.onwarn) {
        this.config.onwarn(message, optionalParams);
      }
    }
  }

  error(message, ...optionalParams) {
    if (this.config.silence === true) return;

    if (this.logLevel <= logLevel.ERROR) {
      console.error(message, ...optionalParams);

      if (this.config.onerror) {
        this.config.onerror(message, optionalParams);
      }
    }
  }

}
const logger = new Logger({
  logLevel: 'INFO',
  // By default we silence the logger. In tests we should call `configureLogger`
  // below to set silence: false.
  silence: true
});
const configureLogger = config => logger.configure(config);

function promisify(f, thisContext) {
  return function (...a) {
    const args = Array.prototype.slice.call(a);
    return new Promise(async (resolve, reject) => {
      try {
        args.push((err, result) => err ? reject(err) : resolve(result));
        await f.apply(thisContext, args);
      } catch (e) {
        reject(e);
      }
    });
  };
}

const getRandomInt = (min = 0, max = Number.MAX_SAFE_INTEGER) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function queryStringFromObject(name, obj) {
  const k = encodeURIComponent(name);
  const v = encodeURIComponent(JSON.stringify(obj));
  return `${k}=${v}`;
}
function queryStringToObject(qs) {
  const p = qs.split('&');
  const o = {};

  for (const v of p) {
    const z = v.split('=');
    o[decodeURIComponent(z[0])] = JSON.parse(decodeURIComponent(z[1]));
  }

  return o;
}

// sanitizeNumberString accepts a number string and returns back a clean number string.
// For example, input '1234.5678' will return '1234.5678' but '12javascript:{}etc' will return '12'
const sanitizeNumberString = numString => {
  if (!numString || typeof numString !== 'string') {
    return '';
  }

  const v = numString.match(/[\d.]+/);
  return v && v.length > 0 ? v[0].trim() : '';
}; // sanitizeAlphanumeric accepts any string and returns alphanumeric contents only

const sanitizeAlphanumeric = alphanum => {
  if (!alphanum || typeof alphanum !== 'string') {
    return '';
  }

  const v = alphanum.match(/[\w\s\d]+/);
  return v && v.length > 0 ? v[0].trim() : '';
}; // sanitizeHost accepts any string and returns valid host string

const sanitizeHost = host => {
  if (!host || typeof host !== 'string') {
    return '';
  }

  const v = host.match(/[\w\d.\-:\/]+/);
  return v && v.length > 0 ? v[0].trim() : '';
};

const sleep = t => {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, t);
  });
};

const encodeTypedDataHash = typedData => {
  const types = _extends({}, typedData.types); // remove EIP712Domain key from types as ethers will auto-gen it in
  // the hash encoder below


  delete types['EIP712Domain'];
  return ethers.ethers.utils._TypedDataEncoder.hash(typedData.domain, types, typedData.message);
};
const encodeTypedDataDigest = typedData => {
  return ethers.ethers.utils.arrayify(encodeTypedDataHash(typedData));
};

// urlClean removes double slashes from url path
const urlClean = url => url.replace(/([^:]\/)\/+/g, '$1');

function isBigNumberish(value) {
  return value != null && (ethers.BigNumber.isBigNumber(value) || typeof value === "number" && value % 1 === 0 || typeof value === "string" && !!value.match(/^-?[0-9]+$/) || utils.isHexString(value) || typeof value === "bigint" || utils.isBytes(value));
}

Object.defineProperty(exports, 'checkProperties', {
  enumerable: true,
  get: function () { return properties.checkProperties; }
});
Object.defineProperty(exports, 'deepCopy', {
  enumerable: true,
  get: function () { return properties.deepCopy; }
});
Object.defineProperty(exports, 'defineReadOnly', {
  enumerable: true,
  get: function () { return properties.defineReadOnly; }
});
Object.defineProperty(exports, 'getStatic', {
  enumerable: true,
  get: function () { return properties.getStatic; }
});
Object.defineProperty(exports, 'resolveProperties', {
  enumerable: true,
  get: function () { return properties.resolveProperties; }
});
Object.defineProperty(exports, 'shallowCopy', {
  enumerable: true,
  get: function () { return properties.shallowCopy; }
});
exports.Logger = Logger;
exports.base64Decode = base64Decode;
exports.base64DecodeObject = base64DecodeObject;
exports.base64Encode = base64Encode;
exports.base64EncodeObject = base64EncodeObject;
exports.configureLogger = configureLogger;
exports.encodeMessageDigest = encodeMessageDigest;
exports.encodeTypedDataDigest = encodeTypedDataDigest;
exports.encodeTypedDataHash = encodeTypedDataHash;
exports.getRandomInt = getRandomInt;
exports.isBigNumberish = isBigNumberish;
exports.isBrowser = isBrowser;
exports.isNode = isNode;
exports.jwtDecodeClaims = jwtDecodeClaims;
exports.logger = logger;
exports.packMessageData = packMessageData;
exports.promisify = promisify;
exports.queryStringFromObject = queryStringFromObject;
exports.queryStringToObject = queryStringToObject;
exports.sanitizeAlphanumeric = sanitizeAlphanumeric;
exports.sanitizeHost = sanitizeHost;
exports.sanitizeNumberString = sanitizeNumberString;
exports.sleep = sleep;
exports.subDigestOf = subDigestOf;
exports.urlClean = urlClean;
