const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs')


let multis, acc1; //accounts
let parachute, mockOracle, tellor; //contracts

const MULTIS = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
const TELLOR = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"

const abi = fs.readFileSync('test/abi.json', 'utf8')

beforeEach(async function() {

  acc1 = await ethers.getSigner()

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [MULTIS]
  })
  multis = ethers.provider.getSigner(MULTIS)
  //deploy mock oracle
  const MockOracle = await ethers.getContractFactory("contracts/test/MockOracle.sol:MockOracle")
  mockOracle = await MockOracle.deploy() 
  
  //deploy parachute
  const Parachute = await ethers.getContractFactory("Parachute")
  parachute = await Parachute.deploy(TELLOR)
  //connect to ITellor to represent Tellor
  tellor = await ethers.getContractAt("ITellor", TELLOR)
  
  //upgrade ITellor to MockOracle
  await tellor.connect(multis).changeTellorContract(mockOracle.address)

  //set MockOracle deity to Parachute
  await tellor.connect(multis).changeDeity(parachute.address)
  
})

afterEach(async function() {
  /** multis should be new deity; this means they can change deity */
  expect(tellor.connect(multis).changeDeity(0))
})

describe("Tellor Parachute", function() {

  it("rescue from 51 percent attack", async function() {

    //multis can't assume control b/c of regular token holder
    await expect(
      parachute.rescue51PercentAttack(acc1.address),
      "parachute took over b/c of regular token holder"
      ).to.be.reverted

    //mint total supply to some address
    await mockOracle.faucet(acc1.address)
    let ts = await mockOracle.totalSupply()
    console.log(Number(ts) / 1E18)
    console.log(Number(await mockOracle.balanceOf(acc1.address)))

    expect(
      Number(await mockOracle.balanceOf(acc1.address))
       * 100 
       / Number(ts)
      ).to.be.greaterThan(51) //these are percentages

    parachute.rescue51PercentAttack(acc1.address)

  });

  it("rescue broken mining", async function() {

    //submit value

    //wait 1 week, expect rescue fails

    //wait another week, expect rescue is allowed


  })

  it("rescue failed update", async function() {

  })

  
});
