//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";


contract Greeter {
  private address deity;
  address tellorMaster;

  constructor(address _tellorMaster) {
    deity = //multis account address
    tellor = _tellorMaster;
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function setGreeting(string memory _greeting) public {
    console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
    greeting = _greeting;
  }

  //rescue tellor
  function _rescue() external {
    (bool sucess, bytes memory data) = tellor.call(
      abi.encodeWithSelector(, arg);
    )
  }
}
