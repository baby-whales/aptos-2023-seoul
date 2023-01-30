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
const PRIVATE_KEY = "0x059476ec5425e7878cd6d85250cf66a17539e9ccea89e25a00292c7a102a53af";
const PUBLIC_ADDRESS = "0x0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34";

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

  const canBalance = await coinClient.checkBalance(owner,{ coinType : "0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin" });
  console.log(`Owner CAN: ${canBalance}`);

  console.log("=== Can Coin Registered ===");
  console.log(`Owner: ${await walletClient.isAccountRegistered(owner.address().hex(),
    CoinType.CAN)}`);
    const mintResult = await walletClient.managedMintToken(owner,owner.address().hex(),CoinType.CAN,1000);
    console.log("=== Mint Result ===");
    console.log(mintResult);


})();
