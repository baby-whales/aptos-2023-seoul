// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient } from "aptos";
import { NODE_URL, FAUCET_URL } from "./common";

/**
  * Creates a new NFT within the specified account
  *
* @param client AptosClient instance
* @param tokenClient AptosClient instance
* @param account AptosAccount where token will be created
* @param collectionName Name of collection, that token belongs to
* @param name Token name
* @param description Token description
* @param uri_cap URL to additional info about token
* @param uri_decap URL to additional info about token
* @param capped capped state of token
* @param stat1 stat1 of token
* @param stat2 stat2 of token
* @param stat3 stat3 of token
* @param stat4 stat4 of token
* @param stat4 stat4 of token
* @param badge1 count of badge1 of token
*/
async function createCannedbiToken(client: AptosClient,
  tokenClient: TokenClient,account: AptosAccount, collectionName: string,
  name: string, description: string, uri_cap: string, uri_decap: string,
  capped: boolean, stat1: number, stat2: number, stat3: number, stat4: number,
  badge1: number) : Promise<void> {
  
    console.log(name);
    const txnHash2 = await tokenClient.createToken(
      account,
      collectionName,
      name,
      "Alice's simple token1",
      1,
      "https://aptos.dev/img/nyan.jpeg",
      1,
      account.address(),
      100,
      5,
      ["uri_capp","uri_decap","capped", "stat1", "stat2", "stat3", "stat4", "badge1"],
      [ uri_cap, uri_decap, capped.toString(), stat1.toString(), stat2.toString(), stat3.toString(), stat4.toString(), badge1.toString()],
      ["string","string","bool", "int", "int", "int", "int", "int"]
    ); // <:!:section_5
    await client.waitForTransaction(txnHash2, { checkSuccess: true });
  
    const collectionData = await tokenClient.getCollectionData(account.address(), collectionName);
  console.log(`Alice's collection: ${JSON.stringify(collectionData, null, 4)}`); // <:!:section_6

    //const tokenData = await tokenClient.getTokenData(account.address(), collectionName, name);
    //console.log(`Alice's token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8
  
      // Get the token balance.
  // :!:>section_7
  const tokenPropertyVersion = 0;

  const aliceBalance1 = await tokenClient.getToken(
    account.address(),
    collectionName,
    name,
    `${tokenPropertyVersion}`,
  );
  console.log(`Alice's token balance: ${aliceBalance1["amount"]}`); // <:!:section_7

  // Get the token data.
  // :!:>section_8
  const tokenData = await tokenClient.getTokenData(account.address(), collectionName, name);
  console.log(`Alice's token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8


}

(async () => {
  // Create API and faucet clients.
  // :!:>section_1a
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL); // <:!:section_1a

  // Create client for working with the token module.
  // :!:>section_1b
  const tokenClient = new TokenClient(client); // <:!:section_1b

  // Create a coin client for checking account balances.
  const coinClient = new CoinClient(client);

  // Create accounts.
  // :!:>section_2
  const alice = new AptosAccount();
  const bob = new AptosAccount(); // <:!:section_2

  // Print out account addresses.
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);
  console.log("");

  // Fund accounts.
  // :!:>section_3
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 100_000_000); // <:!:section_3

  console.log("=== Initial Coin Balances ===");
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
  console.log("");

  console.log("=== Creating Collection and Token ===");

  const collectionName = "Alice's";
  const tokenName = "Alice's first token";
  const tokenName2 = "Alice's first token2";
  const tokenPropertyVersion = 0;

  const tokenId = {
    token_data_id: {
      creator: alice.address().hex(),
      collection: collectionName,
      name: tokenName,
    },
    property_version: `${tokenPropertyVersion}`,
  };

  // Create the collection.
  // :!:>section_4
  const txnHash1 = await tokenClient.createCollection(
    alice,
    collectionName,
    "Alice's simple collection",
    "https://alice.com",
  ); // <:!:section_4
  await client.waitForTransaction(txnHash1, { checkSuccess: true });

  // Create a token in that collection.
  // :!:>section_5
  await createCannedbiToken(client,tokenClient,alice, collectionName, tokenName, "Alice's simple token1", "https://aptos.dev/img/nyan1.jpeg", "https://aptos.dev/img/nyan.jpeg", true, 1, 2, 3, 4, 5);
  await createCannedbiToken(client,tokenClient,alice, collectionName, tokenName2, "Alice's simple token2", "https://aptos.dev/img/nyan1.jpeg", "https://aptos.dev/img/nyan.jpeg", true, 1, 2, 3, 4, 5);
  /*
  const txnHash2 = await tokenClient.createToken(
    alice,
    collectionName,
    tokenName,
    "Alice's simple token",
    1,
    "https://aptos.dev/img/nyan.jpeg",
  ); // <:!:section_5
  await client.waitForTransaction(txnHash2, { checkSuccess: true });

  // Print the collection data.
  // :!:>section_6
  const collectionData = await tokenClient.getCollectionData(alice.address(), collectionName);
  console.log(`Alice's collection: ${JSON.stringify(collectionData, null, 4)}`); // <:!:section_6

  
  // Get the token balance.
  // :!:>section_7
  const aliceBalance1 = await tokenClient.getToken(
    alice.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  console.log(`Alice's token balance: ${aliceBalance1["amount"]}`); // <:!:section_7

  // Get the token data.
  // :!:>section_8
  const tokenData = await tokenClient.getTokenData(alice.address(), collectionName, tokenName);
  console.log(`Alice's token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8
    */

})();
