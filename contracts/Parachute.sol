//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";
import "ITellor.sol";


contract Parachute {
  address private multis;
  address tellorMaster;

  modifier onlyMultis {
    require(msg.sender == multis);
    _;
  }


  constructor(address _tellorMaster) {
    multis = 0x39e419ba25196794b595b2a595ea8e527ddc9856; //multis address
    tellor = _tellorMaster;
  }

  function burnBalance(address _user) external onlyMultis {

  }

  function killContract() external onlyMultis {
    

  }

  function migrateFor(address _user) external onlyMultis {
    
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
        address(_newTellor).call(
            abi.encodeWithSelector(0xfc735e99, "") //verify() signature
        );
    require(
        success && abi.decode(data, (uint256)) < CURRENT_VERSION,
        "new tellor is valid"
    );

    _rescue();

  }

  //resign control to multis
  function _rescue() internal {
    ITellor(tellorMaster).changeDeity(multis);
  }
}
