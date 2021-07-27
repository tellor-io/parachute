const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const fs = require('fs');
const { DH_CHECK_P_NOT_SAFE_PRIME } = require("constants");
let multis, acc1, run, mainnetBlock; //accounts
let parachute, mockOracle, tellor, oldTellorInstance, getters, newExt, newTellor; //contracts
const MULTIS = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
const TELLOR = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"
const fetch = require('node-fetch')

beforeEach(async function() {
  if(run == 0){
    const directors = await fetch('https://api.blockcypher.com/v1/eth/main').then(response => response.json());
    mainnetBlock = directors.height - 10;
    console.log("     Forking from block: ",mainnetBlock)
    run = 1;
  }
  await network.provider.request({
    method: "hardhat_reset",
    params: [{
      forking: {
        jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/MZuPL5XON8haLxn4FW5f8iDABp9S_yT3",
        blockNumber: mainnetBlock
      }
    }]
  })
  tellor = await ethers.getContractAt("contracts/tellor3/ITellor.sol:ITellor", TELLOR)
  getters = await ethers.getContractAt("contracts/tellor3/TellorGetters.sol:TellorGetters", TELLOR)
  let fact = await ethers.getContractFactory("contracts/tellor3/Mocks/TellorTest.sol:TellorTest");
  let ext = await ethers.getContractFactory("contracts/tellor3/Extension.sol:Extension");
  newExt = await ext.deploy();
  await newExt.deployed();
  newTellor = await fact.deploy(newExt.address);
  await newTellor.deployed();
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [MULTIS]
  })
  acc1 = await ethers.getSigner()
  multis = await ethers.getSigner(MULTIS)
  const Parachute = await ethers.getContractFactory("Parachute")
  parachute = await Parachute.deploy()
  //connect to ITellor to represent Tellor
  await tellor.connect(multis).changeTellorContract(newTellor.address)
  //set tellor deity to parachute contract
  await tellor.connect(multis).changeDeity(parachute.address)
})

describe("Tellor Parachute", function() {
  it("rescue from 51 percent attack", async function() {
    //multis can't assume control b/c of regular token holder
    await expect(
      parachute.rescue51PercentAttack(acc1.address),
      "parachute took over b/c of regular token holder"
      ).to.be.reverted
   
    let deity = '0x5fc094d10c65bc33cc842217b2eccca0191ff24148319da094e540a559898961'
    let origDeity = await tellor.getAddressVars(deity)
    //mint total supply to some address
    await tellor.theLazyCoon(acc1.address, BigInt(2E6)*BigInt(1E18)) //2mil tokens
    let ts = await tellor.totalSupply()
    //expect user has 51% of ts minted to them now
    expect(
      Number(await tellor.balanceOf(acc1.address))
       * 100 
       / Number(ts)
      ).to.be.greaterThan(51) //these are percentages
    await parachute.rescue51PercentAttack(acc1.address)
    let newDeity = await tellor.getAddressVars(deity)
    expect(newDeity == multis, "New deity is not multis")
    await tellor.connect(multis).changeDeity(ethers.constants.AddressZero)
    let removeDeity = await tellor.getAddressVars(deity)
    expect(newDeity == ethers.constants.AddressZero, "New deity is not the zero address")
  });

  it("rescue broken data reporting", async function() {
    this.timeout(100000)
    let deity = '0x5fc094d10c65bc33cc842217b2eccca0191ff24148319da094e540a559898961'
    let origDeity = await tellor.getAddressVars(deity)
    let weekInSeconds = 86400*7
    let v;
    let reporters = [r1, r2, r3, r4, r5, r6, r7] = await ethers.getSigners()
    for(var i=0;i< 7;i++) {
      //become a reporter and submit a value
      reporter = reporters[i]
      await tellor.theLazyCoon(reporter.address, BigInt(500)*BigInt(1E18)) //500 tokens
      await tellor.connect(reporter).depositStake()
      v = await tellor.getNewCurrentVariables();
      await tellor.connect(reporter).testSubmitMiningSolution(
          "nonce",
          v["1"],
          ["1000","1000","1000","1000","1000"],
          {
            from: reporter.address,
            value: "0",
          })
    }
    //expect pre-emptive rescue fails, mining still works
    console.log( await tellor.getNewCurrentVariables())
    await expect(
      parachute.connect(multis).rescueBrokenDataReporting(),
      "parachute took over from working mining system"
    ).to.be.reverted
    //wait 1 weeks, rescue succeeds
    await network.provider.send("evm_increaseTime", [1.1*weekInSeconds])
    await network.provider.send("evm_mine")
    await parachute.connect(multis).rescueBrokenDataReporting()
    let newDeity = await tellor.getAddressVars(deity)
    expect(newDeity == multis, "New deity is not multis")
  })
});
