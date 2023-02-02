// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import { AptosClient, AptosAccount, CoinClient, FaucetClient } from "./dist/index";
import { NODE_URL, FAUCET_URL } from "./common";

import { CANNEDBI_BADGE_MACHINE_ADDRESS } from "./common"
import { CANNEDBI_NFT_MACHINE_ADDRESS } from "./common"

import { HexString,MaybeHexString } from "./dist/index";

import { WalletClient , CoinType } from "./wallet_client";

// wdshin's dev key
//const PRIVATE_KEY = "0x059476ec5425e7878cd6d85250cf66a17539e9ccea89e25a00292c7a102a53af";
//const PUBLIC_ADDRESS = "0x0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34";

const PRIVATE_KEY = "0xad01c6a90086c8a739d3f23cd3936c03c1da3c6fbbd415094c6a881ef732130d";
const PUBLIC_ADDRESS = "7791c51653f89f9c07bb5823d0fbebd2633908738cba76d2c9f4ff3ad4d88f5e";

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

    // const newTokenMachineAddr = await walletClient.cannedbiCreateCollection(owner,owner.address().hex(),
    //    "Cannedbi Character NFT Collection #1","Awesome Cannedbi Character Collection #1","https://cannedbi.com");
    // console.log("=== cannedbiCreateCollection Result ===");
    // console.log("newTokenMachineAddr:"+newTokenMachineAddr);

    // const idx = 1;  
    // const idxStr = zeroPad(idx, 4);
    // const uri_cap = "ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/"+idxStr+".png";
    // const uri_decap = "ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/"+idxStr+".png";
    
    // const txnHash4 = await walletClient.cannedbiCreateToken(owner,
    //     newTokenMachineAddr,
    //     "Cannedbi Character NFT #1","Awesome Cannedbi Character#1",
    //     uri_cap,uri_cap,uri_decap,
    //     getRandomInt(10),getRandomInt(10),getRandomInt(10),getRandomInt(10));
    // console.log("=== cannedbiCreateToken Result ===");
    // const txnHash4Result = await client.waitForTransactionWithResult(txnHash4); // <:!:publish
    // console.log(txnHash4Result);
    
// character nft newTokenMachineAddr:0x8073d1ff0609ec68d3591ae329957be107ae5d11467476008aa60ded1481becb


    // const newBadgeTokenMachineAddr = await walletClient.cannedbiBadgeCreateCollection(owner,owner.address().hex(),
    //    "Cannedbi Badge Collection #1","Awesome Cannedbi Badge Collection #1","https://cannedbi.com",
    //    100000000,1000000);
    // console.log("=== cannedbiBadgeCreateCollection Result ===");
    // console.log("newTokenMachineAddr:"+newBadgeTokenMachineAddr);
    // //0x364c6239887d0bb6628c18c5823b1a84614987f57f8fc7b4358836e5f94e74af

    // const idx = 2;  
    
    // const badge_uri="ipfs://bafybeicogarequvz32y64fln3hwjoeccanjbfpkgnpppnuagipypo773ji/"+idx+".png";

    // const txnHash4 = await walletClient.mintGenesisCannedbiBadgeToken(owner,
    //   CANNEDBI_BADGE_MACHINE_ADDRESS,
    //     "Cannedbi Badge NFT #2","Awesome Cannedbi Badge #2 - GREEN GEM",
    //     badge_uri,
    //     100000,
    //     getRandomInt(10),getRandomInt(10),getRandomInt(10),getRandomInt(10));
    // console.log("=== cannedbiCreateToken Result ===");
    // const txnHash4Result = await client.waitForTransactionWithResult(txnHash4); // <:!:publish
    // console.log(txnHash4Result);

})();
