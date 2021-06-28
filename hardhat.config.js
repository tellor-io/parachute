require("dotenv").config()
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");

// //Run this commands to deploy tellor:
// //npx hardhat deploy --net rinkeby --network rinkeby
// //npx hardhat deploy --net  --network mainnet

task("deploy", "Deploy and verify the contracts")
  .addParam("net", "rinkeby or empty for mainnet")
  .setAction(async taskArgs => {

    const timeBeforeRescue = 86400*7
    const tellor = "0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0"

    var network = taskArgs.net
    await run("compile")

    console.log("deploy parachute")
    const Parachute = await ethers.getContractFactory("Parachute")
    const parachute = await Parachute.deploy(tellor, timeBeforeRescue)
    console.log("Parachute deployed to:", parachute.address)
    await parachute.deployed()
    if (network == "mainnet"){
      console.log("Parachute contract deployed to:", "https://etherscan.io/address/" + parachute.address)
      console.log("    transaction hash:", "https://etherscan.io/tx/" + parachute.deployTransaction.hash)
    } else if (network == "rinkeby") {
      console.log("Parachute contract deployed to:", "https://rinkeby.etherscan.io/address/" + parachute.address)
      console.log("    transaction hash:", "https://rinkeby.etherscan.io/tx/" + parachute.deployTransaction.hash)
    } else {
      console.log("Please add network explorer details")
    }

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...')
    await parachute.deployTransaction.wait(3)

    console.log('submitting parachute for etherscan verification...')

    await run("verify:verify", {
      address: parachute.address,
      constructorArguments: [tellor, timeBeforeRescue],
    },
    )

});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version:"0.8.3",
    settings: {
      optimizer: {
        enabled:true,
        runs: 200
      }
    }
  
  },

  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/MZuPL5XON8haLxn4FW5f8iDABp9S_yT3",
        blockNumber: 12600000
      }
    },
    
    rinkeby: {
        url: `${process.env.NODE_URL_RINKEBY}`,
        accounts: [process.env.PRIVATE_KEY],
        gas: 10000000 ,
        gasPrice: 4000000000
    },
    mainnet: {
        url: `${process.env.NODE_URL_MAINNET}`,
        accounts: [process.env.PRIVATE_KEY],
        gas: 10000000 ,
        gasPrice: 8000000000
    }  
  },

  etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN
    },
 
    contractSizer: {
      alphaSort: true,
      runOnCompile: true,
      disambiguatePaths: false,
    },

  mocha: {
    timeout: 50000
  }
  
};

