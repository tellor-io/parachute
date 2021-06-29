const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const fs = require('fs');
const { DH_CHECK_P_NOT_SAFE_PRIME } = require("constants");


let multis, acc1; //accounts
let parachute, mockOracle, tellor, oldTellorInstance, getters, newExt, newTellor; //contracts

const MULTIS = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
const TELLOR = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"

beforeEach(async function() {

  await network.provider.request({
    method: "hardhat_reset",
    params: [{
      forking: {
        jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/MZuPL5XON8haLxn4FW5f8iDABp9S_yT3",
        blockNumber: 12600000
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

  //deploy mock oracle
  // const MockOracle = await ethers.getContractFactory("MockOracle")
  // mockOracle = await MockOracle.deploy() 
  
  //deploy parachute
  const Parachute = await ethers.getContractFactory("Parachute")
  parachute = await Parachute.deploy(TELLOR, 86400*7)

  //connect to ITellor to represent Tellor
  await tellor.connect(multis).changeTellorContract(newTellor.address)

  //throw tellor contract to 0 address
  await tellor.connect(multis).changeTellorContract(ethers.constants.AddressZero)


})

describe("Tellor Parachute", function() {

  it("rescue failed update", async function() {
    let tellorContract = '0x0f1293c916694ac6af4daa2f866f0448d0c2ce8847074a7896d397c961914a08'
    let origAdd = await tellor.getAddressVars(tellorContract)
    console.log("original tellor address",  origAdd)
    
    await expect(origAdd == ethers.constants.AddressZero, "Tellor's address did not start at the zero address") 
    
    //throw deity to parachute 
    await parachute.connect(multis).rescueFailedUpdate()

    //get it back!
    await tellor.connect(multis).changeTellorContract(newTellor.address)
    //read tellor contract adddress
    
    let newAdd = await tellor.getAddressVars(tellorContract)
    console.log("new tellor address", newAdd)
    await expect(newAdd == newTellor.address, "Tellor's address was not updated") 
  })

  it("kill contract", async function() {

    //kill the contract (change tellor deity to 0 address)
    await parachute.connect(multis).killContract()

    //can't change tellor contract if deity is 0 address
    await expect(
      tellor.connect(multis).changeTellorContract(newTellor.address),
      "deity is 0 address but multis could still change contract"
    ).to.be.reverted
  })

  it("migrates tokens", async function() {

    //transfer tokens to the parachute
    //it will send these tokens to acc2 using the migrateFor function
    await tellor.connect(multis).transfer(parachute.address, 1)

    //create signer
    let acc2 = await ethers.getSigner()

    //acc2 does not have a balance yet
    expect(await tellor.balanceOf(acc2.address)).to.equal(0)
    
    //migrate multis token locked in parachute to acc2
    await parachute.connect(multis).migrateFor(acc2.address, 1)

    //balance should be updated
    expect(await tellor.balanceOf(acc2.address)).to.equal(1)

  })

  
});
