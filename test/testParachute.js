const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs')


let multis, acc1; //accounts
let parachute, mockOracle, tellor; //contracts

const MY_ADDRESS = "0xA97cd82A05386eAdaFCE2bbD2e6a0CbBa7A53a6c"
const MULTIS = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
const TELLOR = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"

const abi = fs.readFileSync('test/abi.json', 'utf8')

beforeEach(async function() {

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [MY_ADDRESS]
  })
  acc1 = ethers.provider.getSigner(MY_ADDRESS)

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [MULTIS]
  })
  multis = ethers.provider.getSigner(MULTIS)

  //deploy mock oracle
  const MockOracle = await ethers.getContractFactory("MockOracle")
  mockOracle = await MockOracle.deploy() 

  //connect to ITellor to represent Tellor
  tellor = await ethers.getContractAt("ITellor")

  //upgrade ITellor to MockOracle
  tellor.connect(multis).changeTellorContract(mockOracle.address)

  //set MockOracle deity to Parachute
  console.log(1)
  const Parachute = await ethers.getContractFactory("Parachute")
  parachute = await Parachute.deploy(TELLOR)

  tellor = new ethers.Contract(TELLOR, abi, multis)
  tellor.connect(multis).changeDeity(parachute.address)


  // const Oracle = await ethers.getContractFactory("MockOracle", {
  //   from: parachute.address
  // })
  // oracle = await Oracle.deploy()
  
})

describe("Tellor Parachute", function() {


  
  it("rescue from 51 percent attack", async function() {

    //multis can't assume control b/c of regular token holder
    await expect(
      parachute.rescue51PercentAttack(MY_ADDRESS),
      "parachute took over b/c of regular token holder"
      ).to.be.reverted

    //mint total supply to some address
    oracle.faucet(acc1)
    
    //

  });

  it("rescue broken mining", async function() {

  })

  it("rescue failed update", async function() {

  })

  
});
