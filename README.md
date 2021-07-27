# parachute, the new tellor deity

The Parachute is the new tellor deity, replacing the Tellor team's mutlis account. The motivation behind the Parachute contract is to re-DAO-ify Tellor. The Parachute only functions to restore the Tellor team deity under the following limited, worst-case circumstances:

* Underflow attack (unlimited minting)
* Broken mining (now mining events for a pre-set amount of time)
* Tellor updates to something non-functional (the zero address)

Also includes custom migration logic and the ability to send deity to the zero address, rendering the Parachute useless.


## Setting up and testing

Install Dependencies
```
npm i
```
Compile Smart Contracts
```
npx hardhat compile
```

Test Locally
```
npx hardhat test
```

## Maintainers <a name="maintainers"> </a> 
This repository is maintained by the [Tellor team](https://github.com/orgs/tellor-io/people)


## How to Contribute<a name="how2contribute"> </a>  

Check out our issues log here on Github or feel free to reach out anytime [info@tellor.io](mailto:info@tellor.io)

## Copyright

Tellor Inc. 2021

