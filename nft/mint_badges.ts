// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

//import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS } from "aptos";
import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
//import { OptionalTransactionArgs } from "aptos";
import { OptionalTransactionArgs } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
//import { HexString,MaybeHexString } from "aptos";
import { HexString,MaybeHexString } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";

import { NODE_URL, FAUCET_URL } from "./common";
import { AnyNumber, Bytes, Uint8 , Uint16 } from "./bcs";
import { MAX_U64_BIG_INT } from "./bcs/consts";
//import { HexString, MaybeHexString } from "./hex_string";

// wdshin dev
const PRIVATE_KEY = "0x059476ec5425e7878cd6d85250cf66a17539e9ccea89e25a00292c7a102a53af";
const PUBLIC_ADDRESS = "0x0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34";

//const PRIVATE_KEY = "0x28a44b352e5f6dbc93cfbaae325aa8a68e99b401f54fee19ea03fd6ba4ab7633";
//const PUBLIC_ADDRESS = "0xaf58703596ab584b8dc13f88fa09eca1b97eb11b74d042dcabd07fd0b269d6a2";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function zeroPad(num :number, places:number) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

  /**
   * Creates a new NFT collection within the specified account
   *
   * @param account AptosAccount where collection will be created
   * @param name Collection name
   * @param description Collection description
   * @param uri URL to additional info about collection
   * @param maxAmount Maximum number of `token_data` allowed within this collection
   * @returns The hash of the transaction submitted to the API
   */
  // :!:>createCollection
  async function createCollection(
    client: AptosClient,
    tokenClient : TokenClient,
    account: AptosAccount,
    name: string,
    description: string,
    uri: string,
    maxAmount: AnyNumber = MAX_U64_BIG_INT,
    extraArgs?: OptionalTransactionArgs,
  ): Promise<string> {
    // <:!:createCollection
    const payload = tokenClient.transactionBuilder.buildTransactionPayload(
      "0x3::token::create_collection_script",
      [],
      [name, description, uri, maxAmount, [false, false, false]],
    );

    return client.generateSignSubmitTransaction(account, payload, extraArgs);
  }

/**
   * Creates a new NFT within the specified account
   *
   * @param account AptosAccount where token will be created
   * @param collectionName Name of collection, that token belongs to
   * @param name Token name
   * @param description Token description
   * @param supply Token supply
   * @param uri URL to additional info about token
   * @param max The maxium of tokens can be minted from this token
   * @param royalty_payee_address the address to receive the royalty, the address can be a shared account address.
   * @param royalty_points_denominator the denominator for calculating royalty
   * @param royalty_points_numerator the numerator for calculating royalty
   * @param property_keys the property keys for storing on-chain properties
   * @param property_values the property values to be stored on-chain
   * @param property_types the type of property values
   * @param mutability_config configs which field is mutable
   * @returns The hash of the transaction submitted to the API
   */
  // :!:>createToken
  async function createTokenWithMutabilityConfig(
    client: AptosClient,
    tokenClient : TokenClient,
    account: AptosAccount,
    collectionName: string,
    name: string,
    description: string,
    supply: AnyNumber,
    uri: string,
    max: AnyNumber = MAX_U64_BIG_INT,
    royalty_payee_address: MaybeHexString = account.address(),
    royalty_points_denominator: AnyNumber = 0,
    royalty_points_numerator: AnyNumber = 0,
    property_keys: Array<string> = [],
    property_values: Array<Bytes> = [],
    property_types: Array<string> = [],
    mutability_config: Array<boolean> = [false, false, false, false, false],
    extraArgs?: OptionalTransactionArgs,
  ): Promise<string> {
    // <:!:createToken
    const payload = tokenClient.transactionBuilder.buildTransactionPayload(
      "0x3::token::create_token_script",
      [],
      [
        collectionName,
        name,
        description,
        supply,
        max,
        uri,
        royalty_payee_address,
        royalty_points_denominator,
        royalty_points_numerator,
        mutability_config,
        property_keys,
        property_values,
        property_types,
      ],
    );

    return client.generateSignSubmitTransaction(account, payload, extraArgs);
  }

/**
  * Creates a new NFT within the specified account
  *
* @param client AptosClient instance
* @param tokenClient AptosClient instance
* @param account AptosAccount where token will be created
* @param collectionName Name of collection, that token belongs to
* @param name Token name
* @param description Token description
* @param supply supply 
* @param max max 
* @param uri URL to additional info about token
* @param stat1 stat1 of token
* @param stat2 stat2 of token
* @param stat3 stat3 of token
* @param stat4 stat4 of token
* @param stat4 stat4 of token
* @param badge1 count of badge1 of token
*/
async function createBadgeToken(client: AptosClient,
  tokenClient: TokenClient,account: AptosAccount, collectionName: string,
  name: string, description: string, supply : AnyNumber , max : AnyNumber,uri: string, 
    stat1: Uint8, stat2: Uint8, stat3: Uint8, stat4: Uint8) : Promise<void> {
  
    console.log(name);
    const txnHash2 = await createTokenWithMutabilityConfig(
      client,
      tokenClient,
      account,
      collectionName,
      name,
      description,
      supply,//supply,
      uri,//,
      max,//max,
      account.address(),
      100,
      1,
      ["stat1", "stat2", "stat3", "stat4"],
      [ 
        BCS.bcsSerializeU8(stat1),
        BCS.bcsSerializeU8(stat2),
        BCS.bcsSerializeU8(stat3),
        BCS.bcsSerializeU8(stat4)
      ],
      ["u8", "u8", "u8", "u8"],
      [false,true,true,true,true],// 1,uri,royalty,description, properies
    ); 
    await client.waitForTransaction(txnHash2, { checkSuccess: true });
  

  // Get the token balance.

  const tokenPropertyVersion = 0;

  const aliceBalance1 = await tokenClient.getToken(
    account.address(),
    collectionName,
    name,
    `${tokenPropertyVersion}`,
  );
  console.log(`Token balance: ${aliceBalance1["amount"]}`); 
  console.log("Token : ",aliceBalance1); 

  // Get the token data.
  // :!:>section_8
  const tokenData = await tokenClient.getTokenData(account.address(), collectionName, name);
  console.log(`Token data: ${JSON.stringify(tokenData, null, 4)}`); 


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
  // private key 로 생성하기 
  //const alice_private_key = new HexString(PRIVATE_KEY);
  //const alice = new AptosAccount(alice_private_key.toUint8Array(),PUBLIC_ADDRESS);
  const alice = new AptosAccount();
  const bob = new AptosAccount();
  
  // Print out account addresses.
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.address()}`);
  console.log("");

  // Fund accounts.
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 100_000_000); // <:!:section_3

  console.log("=== Initial Coin Balances ===");
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log("");

  console.log("=== Creating Collection and Token ===");

  const collectionName = "Cannedbi Badge Collection #1" ;
 
  // create cannedbi collection
  const txnHash1 = await createCollection(client,tokenClient,alice, collectionName, 
    "Cannedbi Badge collection", "https://cannedbi.com");
  await client.waitForTransaction(txnHash1, { checkSuccess: true });

  const collectionData = await tokenClient.getCollectionData(alice.address(), collectionName);
  console.log(`Cannedbi's Badge collection: ${JSON.stringify(collectionData, null, 4)}`); 

  const maxMintCount = 6;

  for (let idx = 1; idx <= maxMintCount; idx++) {

    const tokenName = "Cannedbi Badge #"+idx;
    const description = "Cannedbi Badge #"+idx;

    const uri = "ipfs://bafybeiek3o5x3vkpthkif2qjxvpl7vfotoi4lbifpauce5gmexdbcdjhqi/badge"+idx+".png";
    await createBadgeToken(client,tokenClient,alice, collectionName, tokenName, 
      description,
      1000,10000,
      uri, 
      getRandomInt(10), getRandomInt(10), getRandomInt(10), getRandomInt(10));
      
    const tokenPropertyVersion = 0;
    const tokenId = {
      token_data_id: {
        creator: alice.address().hex(),
        collection: collectionName,
        name: tokenName,
      },
      property_version: `${tokenPropertyVersion}`,
    };
  
  // Alice offers one token to Bob.
  console.log("\n=== Transferring the token to Bob ===");
  // :!:>section_9
  const txnHash3 = await tokenClient.offerToken(
    alice,
    bob.address(),
    alice.address(),
    collectionName,
    tokenName,
    1,
    tokenPropertyVersion,
  ); // <:!:section_9
  await client.waitForTransaction(txnHash3, { checkSuccess: true });

  // Bob claims the token Alice offered him.
  // :!:>section_10
  const txnHash4 = await tokenClient.claimToken(
    bob,
    alice.address(),
    alice.address(),
    collectionName,
    tokenName,
    tokenPropertyVersion,
  ); // <:!:section_10
  await client.waitForTransaction(txnHash4, { checkSuccess: true });

  // Print their balances.
  const aliceBalance2 = await tokenClient.getToken(
    alice.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  const bobBalance2 = await tokenClient.getTokenForAccount(bob.address(), tokenId);
  console.log(`Alice's token balance: ${aliceBalance2["amount"]}`);
  console.log(`Bob's token balance: ${bobBalance2["amount"]}`);

  console.log("\n=== Transferring the token ===");
  // :!:>section_11
  let txnHash5 = await tokenClient.directTransferToken(
    alice,
    bob,
    alice.address(),
    collectionName,
    tokenName,
    1,
    tokenPropertyVersion,
  ); // <:!:section_11
  await client.waitForTransaction(txnHash5, { checkSuccess: true });

  // Print out their balances one last time.
  const aliceBalance3 = await tokenClient.getToken(
    alice.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  const bobBalance3 = await tokenClient.getTokenForAccount(bob.address(), tokenId);
  console.log(`Alice's token balance: ${aliceBalance3["amount"]}`);
  console.log(`Bob's token balance: ${bobBalance3["amount"]}`);

  }
  
})();
