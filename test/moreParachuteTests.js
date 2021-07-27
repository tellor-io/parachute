// const { expect } = require("chai");
// const { ethers, network } = require("hardhat");
// const fs = require('fs');
// const { DH_CHECK_P_NOT_SAFE_PRIME } = require("constants");
// let multis, acc1, run, mainnetBlock; //accounts
// let parachute, mockOracle, tellor, oldTellorInstance, getters, newExt, newTellor; //contracts
// const MULTIS = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
// const TELLOR = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"
// var assert = require('assert');

// beforeEach(async function() {
//   if(run == 0){
//     const directors = await fetch('https://api.blockcypher.com/v1/eth/main').then(response => response.json());
//     mainnetBlock = directors.height - 10;
//     console.log("     Forking from block: ",mainnetBlock)
//     run = 1;
//   }
//   await network.provider.request({
//     method: "hardhat_reset",
//     params: [{
//       forking: {
//         jsonRpcUrl: hre.config.networks.hardhat.forking.url,
//         blockNumber: mainnetBlock
//       }
//     }]
//   })
//   tellor = await ethers.getContractAt("contracts/tellor3/ITellor.sol:ITellor", TELLOR)
//   getters = await ethers.getContractAt("contracts/tellor3/TellorGetters.sol:TellorGetters", TELLOR)
//   let fact = await ethers.getContractFactory("contracts/tellor3/Mocks/TellorTest.sol:TellorTest");
//   let ext = await ethers.getContractFactory("contracts/tellor3/Extension.sol:Extension");
//   newExt = await ext.deploy();
//   await newExt.deployed();
//   newTellor = await fact.deploy(newExt.address);
//   await newTellor.deployed();
//   await hre.network.provider.request({
//     method: "hardhat_impersonateAccount",
//     params: [MULTIS]
//   })
//   acc1 = await ethers.getSigner()
//   multis = await ethers.getSigner(MULTIS)
//   //deploy parachute
//   const Parachute = await ethers.getContractFactory("Parachute")
//   parachute = await Parachute.deploy()
//   //connect to ITellor to represent Tellor
//   await tellor.connect(multis).changeTellorContract(newTellor.address)
// })

// describe("Tellor Parachute", function() {
//   it("rescue failed update", async function() {
//     await expect(
//       parachute.connect(multis).rescueFailedUpdate(),
//       "tellor address should be valid"
//     ).to.be.reverted
//     await tellor.connect(multis).changeTellorContract(ethers.constants.AddressZero)
//     await tellor.connect(multis).changeDeity(parachute.address)
//     let tellorContract = '0x0f1293c916694ac6af4daa2f866f0448d0c2ce8847074a7896d397c961914a08'
//     await expect(
//       tellor.getAddressVars(tellorContract),
//       "shouldn't be able to read"
//     ).to.be.reverted
//     //throw deity to parachute 
//     await parachute.connect(multis).rescueFailedUpdate()
//     //get it back!
//     await tellor.connect(multis).changeTellorContract(newTellor.address)
//     //read tellor contract adddress
//     let newAdd = await tellor.getAddressVars(tellorContract)
//     await assert(newAdd == newTellor.address, "Tellor's address was not updated") 
//   })

//   it("kill contract", async function() {
//     await tellor.connect(multis).changeDeity(parachute.address)
//     console.log("here")
//     await parachute.connect(multis).killContract()
//     //can't change tellor contract if deity is 0 address
//     await expect(
//       tellor.connect(multis).changeTellorContract(newTellor.address),
//       "deity is 0 address but multis could still change contract"
//     ).to.be.reverted
//     let deity = '0x5fc094d10c65bc33cc842217b2eccca0191ff24148319da094e540a559898961'
//     let newDeity = await tellor.getAddressVars(deity)
//     assert(newDeity == ethers.constants.AddressZero, "New deity is not multis")//should be zero addy
//   })

//   it("migrates tokens", async function() {
//     //transfer tokens to the parachute
//     //it will send these tokens to acc2 using the migrateFor function
//     await tellor.connect(multis).transfer(parachute.address, 100)
//     //create signer
//     let acc2 = await ethers.getSigner()
//     //acc2 does not have a balance yet
//     assert(await tellor.balanceOf(acc2.address) ==  0, "should have 0");
//     //migrate multis token locked in parachute to acc2
//     await parachute.connect(multis).migrateFor(acc2.address, 1)
//     //balance should be updated
//     assert(await tellor.balanceOf(acc2.address) == 1, "should have 1")
//     await expect(
//       parachute.connect(multis).migrateFor(acc2.address, 5555551),
//       "cannot send tokens it doesn't have"
//     ).to.be.reverted
//   })
// });
