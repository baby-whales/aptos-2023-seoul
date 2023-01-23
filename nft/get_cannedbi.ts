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

//const PRIVATE_KEY = "0x059476ec5425e7878cd6d85250cf66a17539e9ccea89e25a00292c7a102a53af";
//const PUBLIC_ADDRESS = "0x0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34";

const PRIVATE_KEY = "0x28a44b352e5f6dbc93cfbaae325aa8a68e99b401f54fee19ea03fd6ba4ab7633";
const PUBLIC_ADDRESS = "0xaf58703596ab584b8dc13f88fa09eca1b97eb11b74d042dcabd07fd0b269d6a2";

(async () => {
    // Create API and faucet clients.
    const client = new AptosClient(NODE_URL);
    const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL); // <:!:section_1a

    // Create client for working with the token module.
    const tokenClient = new TokenClient(client); // <:!:section_1b

    // Create a coin client for checking account balances.
    const coinClient = new CoinClient(client);

    // Create accounts.
    const alice_private_key = new HexString(PRIVATE_KEY);
    const alice = new AptosAccount(alice_private_key.toUint8Array(),PUBLIC_ADDRESS);
    //const alice = new AptosAccount();

    // Print out account addresses.
    console.log("=== Addresses ===");
    console.log(`Alice: ${alice.address()}`);
    console.log("");

    // Fund accounts.
    await faucetClient.fundAccount(alice.address(), 100_000_000);

    console.log("=== Initial Coin Balances ===");
    console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
    console.log("");

    const collectionName = "Cannedbi NFT Collection #2";

    const collectionData = await tokenClient.getCollectionData(alice.address(), collectionName);
    console.log(`Cannedbi collection: ${JSON.stringify(collectionData, null, 4)}`); 

    const idx = 1;
    const tokenName = "Cannedbi #"+idx;
    //const description = "Cannedbi NFT #"+idx;



    const tokenData = await tokenClient.getTokenData(alice.address(), collectionName, tokenName);
    console.log(`Cannedbi token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8

    const tokenPropertyVersion = 0;
    const tokenId = {
        token_data_id: {
            creator: alice.address().hex(),
            collection: collectionName,
            name: tokenName,
        },
        property_version: `${tokenPropertyVersion}`,
    };

    const tokenData2 = await tokenClient.getTokenForAccount(alice.address(), tokenId);
    console.log(`Cannedbi token data: ${JSON.stringify(tokenData2, null, 4)}`); // <:!:section_8

    

    
})();
