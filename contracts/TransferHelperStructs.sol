// SPDX-License-Identifier: MIT
pragma solidity >=0.8.7;

import { ConduitItemType } from "./ConduitEnums.sol";

struct TransferHelperItem {
    ConduitItemType itemType;
    address token;
    uint256 identifier;
    uint256 amount;
}