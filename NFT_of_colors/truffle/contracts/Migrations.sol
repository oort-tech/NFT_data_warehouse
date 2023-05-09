pragma solidity 0.8.4;

contract Migrations {
    uint public last_completed_migration;
    address public owner = msg.sender;
    modifier restricted() {
        require(
            msg.sender == owner,
            "This function is limited to the contract's owner"
        );
        _;
    }

    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }
}
