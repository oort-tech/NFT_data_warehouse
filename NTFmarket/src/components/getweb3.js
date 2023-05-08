import Web3 from "web3";

let getWeb3 = new Promise(function(resolve, reject) {
  // Check for injected web3 (mist/metamask)
  var web3js = window.ethereum;
  if (typeof web3js !== "undefined") {
    var web3 = new Web3(web3js);
    resolve({
      injectedWeb3: true,
      web3() {
        return web3;
      }
    });
  } else {
    reject(new Error("Unable to connect to Metamask"));
  }
})
  .then(result => {
    return new Promise(function(resolve, reject) {
      // Retrieve network ID
      result.web3()
        .eth.net.getId()
        .then(networkId => {
          // Assign the networkId property to our result and resolve promise
          result = Object.assign({}, result, { networkId });
          resolve(result);
        })
        .catch(error => {
          // If we can't find a networkId keep result the same and reject the promise
          reject(new Error("Unable to retrieve network ID"));
        });
    });
  })
  .then(result => {
    return new Promise(function(resolve, reject) {
      // Retrieve coinbase
      result.web3()
        .eth.getAccounts()
        .then(accounts => {
          result = Object.assign({}, result, { coinbase: accounts[0] });
          resolve(result);
        })
        .catch(error => {
          reject(new Error("Unable to retrieve coinbase"));
        });
    });
  })
  .then(result => {
    return new Promise(function(resolve, reject) {
      // Retrieve balance for coinbase
      result.web3()
        .eth.getBalance(result.coinbase)
        .then(balance => {
          result = Object.assign({}, result, { balance });
          resolve(result);
        })
        .catch(error => {
          reject(
            new Error(
              "Unable to retrieve balance for address: " + result.coinbase
            )
          );
        });
    });
  });

export default getWeb3;
