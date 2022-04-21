import React, { Component } from "react";
import WhitelistContract from "./contracts/Whitelist.json";
import getWeb3 from "./getWeb3";
import MerkleTree from "./MerkleTree";

import "./App.css";

class App extends Component {
  state = { web3: null, accounts: null, contract: null, merkleTree: null };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = WhitelistContract.networks[networkId];
      const instance = new web3.eth.Contract(WhitelistContract.abi, deployedNetwork && deployedNetwork.address);

      const merkleTree = new MerkleTree([
        accounts[0],
        accounts[1],
        accounts[2],
        accounts[3],
        accounts[4],
        accounts[5],
      ]);

      this.setState({ web3, accounts, contract: instance, merkleTree: merkleTree });

      // First account is the administrator.
      await instance.methods.setMerkleTreeRoot(merkleTree.Root()).send({ from: accounts[0] });
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
      console.error(error);
    }
  };

  validate = async account => {
    const { contract, merkleTree } = this.state;

    try {
      const proof = merkleTree.ExtractProof(account);
      const valid = await contract.methods.verify(proof).call({ from: account });
      alert(valid ? '✓ This account is in the whitelist.' : '𐄂 This account is not in the whitelist!');
    } catch (error) {
      alert(error);
      console.error(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading ...</div>;
    }
    return (
      <div className="App">
        <h1>Coding Challenge</h1>
        <h2>Merkle Tree Whitelist</h2>
        <h4>By Meysam Mousavi</h4>
        <p>
          The whitelist merkle tree root is:<br />
          <code>{this.state.merkleTree.Root()}</code>
        </p>
        <p>Click on each account to check it with smart contract.</p>
        <ul>
          {
            this.state.accounts.map((account, index) => (
              <li key={index}
                onClick={_ => this.validate(account)}
                className={index < 6 ? 'whitelist' : 'blocked'}>{account}</li>
            ))
          }
        </ul>
      </div>
    );
  }
}

export default App;
