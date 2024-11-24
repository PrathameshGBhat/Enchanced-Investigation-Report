pragma solidity ^0.5.16;

contract Migrations {
  address public owner;
  uint public last_completed_migration;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  // Update the constructor syntax
  constructor() public {
    owner = msg.sender;
  }

  // Add "public" visibility to the function
  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }

  // Add "public" visibility to the function
  function upgrade(address new_address) public restricted {
    Migrations upgraded = Migrations(new_address);
    upgraded.setCompleted(last_completed_migration);
  }
}
