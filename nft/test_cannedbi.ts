// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import { AptosClient, AptosAccount, CoinClient, FaucetClient } from "./dist/index";
import { NODE_URL, FAUCET_URL } from "./common";

import { HexString,MaybeHexString } from "./dist/index";

import { WalletClient , CoinType } from "./wallet_client";

// wdshin's dev key
//const PRIVATE_KEY = "0x059476ec5425e7878cd6d85250cf66a17539e9ccea89e25a00292c7a102a53af";
//const PUBLIC_ADDRESS = "0x0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34";

const PRIVATE_KEY = "0x5e75d0cc8b06b32dc7661ed52a779f43b0f49d78b1ae128139c61237b0b4d1f6";
const PUBLIC_ADDRESS = "c84a935f76c07f852d1378c6894b7b61ac8780671dc281af5f479b48b4a5afad";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}
  
function zeroPad(num :number, places:number) {
    var zero = places - num.toString().length + 1; 
    return Array(+(zero > 0 && zero)).join("0") + num;
}

(async () => {
  // Create API and faucet clients.
  // :!:>section_1
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL); // <:!:section_1

  // Create client for working with the coin module.
  // :!:>section_1a
  const coinClient = new CoinClient(client); // <:!:section_1a

  const walletClient = new WalletClient(NODE_URL,FAUCET_URL);

  // Create accounts.
  // :!:>section_2
  const owner_private_key = new HexString(PRIVATE_KEY);
  const owner = new AptosAccount(owner_private_key.toUint8Array(),PUBLIC_ADDRESS);

  const alice = new AptosAccount();
  const bob = new AptosAccount(); // <:!:section_2

  // Print out account addresses.
  console.log("=== Addresses ===");
  console.log(`Owner: ${owner.address()}`);
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);
  console.log("");

  // Fund accounts.
  // :!:>section_3
  await faucetClient.fundAccount(owner.address(), 100_000_000);
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 100_000_000); // <:!:section_3

  // Print out initial balances.
  console.log("=== Initial Balances ===");
  // :!:>section_4
  console.log(`Owner: ${await coinClient.checkBalance(owner)}`);
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`); // <:!:section_4
  console.log("");

  // Have Alice send Bob some AptosCoins.
  // :!:>section_5
  let txnHash = await coinClient.transfer(alice, bob, 1_000, { gasUnitPrice: BigInt(100) }); // <:!:section_5
  // :!:>section_6a
  await client.waitForTransaction(txnHash); // <:!:section_6a

  // Print out intermediate balances.
  console.log("=== Intermediate Balances ===");
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
  console.log("");

  // Have Alice send Bob some more AptosCoins.
  txnHash = await coinClient.transfer(alice, bob, 1_000, { gasUnitPrice: BigInt(100) });
  // :!:>section_6b
  await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:section_6b

  // Print out final balances.
  console.log("=== Final Balances ===");
  console.log(`Owner: ${await coinClient.checkBalance(owner)}`);
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
  console.log("");



  console.log("=== Can Coin Registered ===");
  console.log(`Owner: ${await walletClient.isAccountRegistered(owner.address().hex(),
    CoinType.CAN)}`);
    //const txnHash2 = 
    const txnHash2 = await walletClient.managedRegisterToken(owner,CoinType.CAN);
    console.log("=== registerToken Result ===");
    console.log(txnHash2);

    const txnHash3 = await walletClient.managedMintToken(owner,owner.address().hex(),CoinType.CAN,1000);
    console.log("=== managedMintToken Result ===");
    console.log(txnHash3);
    await client.waitForTransaction(txnHash3, { checkSuccess: true }); // <:!:publish

    const canBalance = await coinClient.checkBalance(owner,
        { coinType : walletClient.getCoinType(CoinType.CAN) });
      console.log(`Owner CAN: ${canBalance}`);

    const idx = 2;  
    const idxStr = zeroPad(idx, 4);
    const uri_cap = "ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/"+idxStr+".png";
    const uri_decap = "ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/"+idxStr+".png";
    
    const txnHash4 = await walletClient.cannedbiCreateToken(owner,
        "Cannedbi NFT #2","Awesome Cannedbi #2",
        uri_cap,uri_cap,uri_decap,
        getRandomInt(10),getRandomInt(10),getRandomInt(10),getRandomInt(10));
    console.log("=== cannedbiCreateToken Result ===");
    console.log(txnHash4);
    await client.waitForTransaction(txnHash4, { checkSuccess: true }); // <:!:publish
  

})();
