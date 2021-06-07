//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";
import "ITellor.sol";


contract Greeter {
  address private multis;
  address tellorMaster;


  constructor(address _tellorMaster) {
    multis = 0x39e419ba25196794b595b2a595ea8e527ddc9856 ; //multis address
    tellor = _tellorMaster;
  }

  function rescueFailedUpdate() external {
    (bool success, bytes memory data) =
        address(_newTellor).call(
            abi.encodeWithSelector(0xfc735e99, "") //verify() signature
        );
    require(
        success && abi.decode(data, (uint256)) < CURRENT_VERSION,
        "new tellor is valid"
    );

    _rescue();

  }

  function rescue51PercentAttack(address _tokenHolder) external {
    require(
      ITellor(tellorMaster).balanceOf(_tokenHolder) * 100 / ITellor(tellorMaster).totalSupply() >= 51,
      "attacker balance is < 51% of total supply"
    );

    _rescue();
  }

  //resign control to multis
  function _rescue() internal {
    ITellor(tellorMaster).changeDeity(multis);
  }
}
