//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";
import "contracts/tellor3/ITellor.sol";
import "contracts/tellor3/TellorStorage.sol";


contract Parachute is TellorStorage {
  address private multis;
  address tellorMaster;
  uint timeBeforeRescue;
  uint lastSubmissionTime;

  modifier onlyMultis {
    require(
      msg.sender == multis,
      "only multis wallet can call this");
    _;
  }


  constructor(address _tellorMaster, uint _timeBeforeRescue) {
    multis = 0x39E419bA25196794B595B2a595Ea8E527ddC9856; //multis address
    tellorMaster = _tellorMaster;
    timeBeforeRescue = _timeBeforeRescue;
  }

  function killContract() external onlyMultis {
    ITellor(tellorMaster).changeDeity(address(0));
  }

  function migrateFor(
      address _destination,
      uint256 _amount
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

  function rescueBrokenMining() external onlyMultis {
    for (uint i = 6000; i < 12000; i++) {
      try TellorStorage(tellorMaster).newValueTimestamps(i) returns (uint timestamp) {
        lastSubmissionTime = timestamp;
      } catch {
        console.log(i);
        lastSubmissionTime = TellorStorage(tellorMaster).newValueTimestamps(i - 1);
        break;
      }
    }
    // uint length = TellorStorage(tellorMaster).getNewValueTimestampLength();
    // console.log(length);
    // uint lastSubmissionTime = TellorStorage(tellorMaster).newValueTimestamps(length - 1);

    require(
      timeBeforeRescue < block.timestamp - lastSubmissionTime,
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
        !success || abi.decode(data, (uint256)) < 2999,
        "new tellor is valid"
    );

    _rescue();

  }

  //resign control to multis
  function _rescue() internal {
    ITellor(tellorMaster).changeDeity(multis);
  }
}
