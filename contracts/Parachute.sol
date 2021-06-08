//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";
import "contracts/ITellor.sol";


contract Parachute {
  address private multis;
  address tellorMaster;

  modifier onlyMultis {
    require(
      msg.sender == multis,
      "only multis wallet can call this");
    _;
  }


  constructor(address _tellorMaster) {
    multis = 0x39E419bA25196794B595B2a595Ea8E527ddC9856; //multis address
    tellorMaster = _tellorMaster;
  }

  function killContract() external onlyMultis {
    ITellor(tellorMaster).changeDeity(address(0));
  }

  function migrateFor(
      address _destination,
      uint256 _amount,
      bool _bypass
  ) external onlyMultis {
      ITellor(tellorMaster).transfer(_destination, _amount);
  }


  function rescue51PercentAttack(address _tokenHolder) external {
    require(
      ITellor(tellorMaster).balanceOf(_tokenHolder) * 100 / ITellor(tellorMaster).totalSupply() >= 51,
      "attacker balance is < 51% of total supply"
    );

    _rescue();
  }

  function rescueBrokenMining(uint _numSeconds, uint _requestId) external onlyMultis {

    //get new value count by request id
    uint index = ITellor(tellorMaster).getNewValueCountbyRequestId(_requestId);
    //check timestamp of last submit to request ID using value count
    uint lastSubmissionTime = ITellor(tellorMaster).getTimestampbyRequestIDandIndex(_requestId, index);
    
    require(
      _numSeconds > block.timestamp - lastSubmissionTime,
      "mining is active on this requestID"
    );

    _rescue();
  }

  function rescueFailedUpdate() external {
    (bool success, bytes memory data) =
        address(tellorMaster).call(
            abi.encodeWithSelector(0xfc735e99, "") //verify() signature
        );
    require(
        !success || abi.decode(data, (uint256)) < ITellor(tellorMaster).verify(),
        "new tellor is valid"
    );

    _rescue();

  }

  //resign control to multis
  function _rescue() internal {
    ITellor(tellorMaster).changeDeity(multis);
  }
}
