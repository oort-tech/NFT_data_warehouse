import { BigNumber, BigNumberish } from "ethers";
export declare function safeSolve<T>(promise: Promise<T>, def: T | ((e: any) => T)): Promise<T>;
export declare function partition<T>(array: T[], callback: (v: T, i: number) => boolean): [T[], T[]];
export declare type BlockTag = 'earliest' | 'latest' | 'pending' | BigNumber;
export declare function parseBlockTag(cand: string | BigNumberish | undefined): BlockTag;
export declare function eqBlockTag(a: BlockTag, b: BlockTag): boolean;
