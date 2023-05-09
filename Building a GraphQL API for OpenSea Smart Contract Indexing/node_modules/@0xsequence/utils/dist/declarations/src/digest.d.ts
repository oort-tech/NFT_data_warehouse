import { ethers } from 'ethers';
export declare const encodeMessageDigest: (message: string | Uint8Array) => Uint8Array;
export declare const packMessageData: (walletAddress: string, chainId: ethers.BigNumberish, digest: ethers.BytesLike) => string;
export declare const subDigestOf: (address: string, chainId: ethers.BigNumberish, digest: ethers.BytesLike) => string;
