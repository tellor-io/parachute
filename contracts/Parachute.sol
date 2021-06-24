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

  /**
   * @param _tellorMaster is TellorMaster address
   * @param _timeBeforeRescue is the timeframe before the key can be reinstated because
   * data is not being added on-chain
   */
  constructor(address _tellorMaster, uint _timeBeforeRescue) {
    multis = 0x39E419bA25196794B595B2a595Ea8E527ddC9856; //multis address
    tellorMaster = _tellorMaster;
    timeBeforeRescue = _timeBeforeRescue;
  }

  /**
   * @dev Use this function to end parachutes ability to reinstate Tellor's admin key
   */
  function killContract() external onlyMultis {
    ITellor(tellorMaster).changeDeity(address(0));
  }

  /**
   * @dev This function allows the Tellor Team to migrate old TRB token to the new one
   * @param _destination is the destination adress to migrate tokens to
   * @param _amount is the amount of tokens to migrate
   */
  function migrateFor(
      address _destination,
      uint256 _amount
  ) external onlyMultis {
      ITellor(tellorMaster).transfer(_destination, _amount);
  }

  /**
   * @dev This function allows the Tellor community to reinstate and admin key if an attacker
   * is able to get 51% or more of the total TRB supply.
   * @param _tokenHolder address to check if they hold more than 51% of TRB
   */
  function rescue51PercentAttack(address _tokenHolder) external {
    require(
      ITellor(tellorMaster).balanceOf(_tokenHolder) * 100 / ITellor(tellorMaster).totalSupply() >= 51,
      "attacker balance is < 51% of total supply"
    );

    _rescue();
  }

  /**
   * @dev Allows the TellorTeam to reinstate the admin key if a long time(timeBeforeRescue)
   * has gone by without a value being added on-chain
   * @param index is the index in the newValueTimestamps array to check if it is  the last in
   * the array: It is used to pull the last time a value was added on-chain to ensure the system
   * is alive
   */
  function rescueBrokenDataReporting(uint index) external {
    bool pass;
    try TellorStorage(tellorMaster).newValueTimestamps(index + 1) {
      pass = false;
    } catch {
      lastSubmissionTime = TellorStorage(tellorMaster).newValueTimestamps(index);
      pass = true;
    }

    require(
      pass,
      "newer timestamps available, call with higher index");

    require(
      timeBeforeRescue < block.timestamp - lastSubmissionTime,
      "mining is active"
    );

    _rescue();
  }


  /**
   * @dev Allows the Tellor community to reinstate the admin key if tellor is updated
   * to an invalid address.
   */
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

  /**
   *@dev This internal function allows the rescue functions to to Tellor's multi sig wallet
   */
  function _rescue() internal {
    ITellor(tellorMaster).changeDeity(multis);
  }
}
