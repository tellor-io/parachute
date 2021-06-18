//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

import "hardhat/console.sol";
import "contracts/tellor3/ITellor.sol";
import "contracts/tellor3/TellorStorage.sol";

contract Parachute is TellorStorage {
    address private multis;
    address tellorMaster;
    uint256 timeBeforeRescue;

    modifier onlyMultis {
        require(msg.sender == multis, "only multis wallet can call this");
        _;
    }

    /**
     * @dev This constructor sets the inital contract variables
     * for the Tellor Parachute, which intends to rescue ownership
     * of the Tellor system in case of unpredictable failure.
     * @param _tellorMaster the address of the Tellor master contract
     * @param _timeBeforeRescue the amount of mining downtime before
     * multis can take over
     */
    constructor(address _tellorMaster, uint256 _timeBeforeRescue) {
        multis = 0x39E419bA25196794B595B2a595Ea8E527ddC9856; //multis address
        tellorMaster = _tellorMaster;
        timeBeforeRescue = _timeBeforeRescue;
    }

    /**@dev Sends the tellor deity to the zero address
     * Effectively makes this contract useless */
    function killContract() external onlyMultis {
        ITellor(tellorMaster).changeDeity(address(0));
    }

    /**@dev Migrates TRB from the multis account to an account
     * @param _destination destination addresss
     * @param _amount amount of TRB to send
     */
    function migrateFor(address _destination, uint256 _amount)
        external
        onlyMultis
    {
        ITellor(tellorMaster).transfer(_destination, _amount);
    }

    /**@dev Enables team to become deity in case of
     * underflow/unlimited minting attack
     * @param _tokenHolder accessible account w/ 51% of total supply
     */
    function rescue51PercentAttack(address _tokenHolder) external {
        require(
            (ITellor(tellorMaster).balanceOf(_tokenHolder) * 100) /
                ITellor(tellorMaster).totalSupply() >=
                51,
            "attacker balance is < 51% of total supply"
        );

        _rescue();
    }

    /**@dev Enables team to become deity if mining fails for
     * amount of time pre-set in constructor
     */
    function rescueBrokenMining() external onlyMultis {
        uint256 length = TellorStorage(tellorMaster)
        .getNewValueTimestampLength();
        uint256 lastSubmissionTime = TellorStorage(tellorMaster)
        .newValueTimestamps(length - 1);

        require(
            timeBeforeRescue < block.timestamp - lastSubmissionTime,
            "mining is active on this requestID"
        );

        _rescue();
    }

    /**@dev Enables team to become deity if an update goes terribly wrong! */
    function rescueFailedUpdate() external {
        (bool success, bytes memory data) = address(tellorMaster).call(
            abi.encodeWithSelector(0xfc735e99, "") //verify() signature
        );
        require(
            !success || abi.decode(data, (uint256)) < 2999,
            "new tellor is valid"
        );

        _rescue();
    }

    /**@dev (internal) restore deity to multis */
    function _rescue() internal {
        ITellor(tellorMaster).changeDeity(multis);
    }
}
