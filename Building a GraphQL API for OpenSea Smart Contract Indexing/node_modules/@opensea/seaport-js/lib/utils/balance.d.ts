import { providers as multicallProviders } from "@0xsequence/multicall";
import { BigNumber } from "ethers";
import type { InputCriteria, Item } from "../types";
export declare const balanceOf: (owner: string, item: Item, multicallProvider: multicallProviders.MulticallProvider, criteria?: InputCriteria) => Promise<BigNumber>;
