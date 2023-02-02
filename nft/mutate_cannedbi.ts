// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

import dotenv from "dotenv";
dotenv.config();

//import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS } from "aptos";
import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS } from "./dist/index";
//import { OptionalTransactionArgs } from "aptos";
import { OptionalTransactionArgs } from "./dist/index";
//import { HexString,MaybeHexString } from "aptos";
import { HexString,MaybeHexString } from "./dist/index";

import { NODE_URL, FAUCET_URL } from "./common";
import { AnyNumber, Bytes, Uint8 , Uint16 } from "./bcs";
import { MAX_U64_BIG_INT } from "./bcs/consts";
//import { HexString, MaybeHexString } from "./hex_string";

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
 * creator mutates the properties of the tokens
 *
 * @param account AptosAccount who modifies the token properties
 * @param tokenOwner the address of account owning the token
 * @param creator the creator of the token
 * @param collection_name the name of the token collection
 * @param tokenName the name of created token
 * @param propertyVersion the property_version of the token to be modified
 * @param amount the number of tokens to be modified
 *
 * @returns The hash of the transaction submitted to the API
 */
async function mutateTokenProperties(
    client: AptosClient,
    tokenClient : TokenClient,
    account: AptosAccount,
    tokenOwner: HexString,
    creator: HexString,
    collection_name: string,
    tokenName: string,
    propertyVersion: AnyNumber,
    amount: AnyNumber,
    keys: Array<string>,
    values: Array<Bytes>,
    types: Array<string>,
    extraArgs?: OptionalTransactionArgs,
): Promise<string> {

    //console.log("mutateTokenProperties:", tokenOwner, creator, collection_name, tokenName, propertyVersion, amount, keys, values, types, "");
    const payload = tokenClient.transactionBuilder.buildTransactionPayload(
    "0x3::token::mutate_token_properties",
    [],
    [tokenOwner, creator, collection_name, tokenName, propertyVersion, amount, keys, values, types],
    );

    return client.generateSignSubmitTransaction(account, payload, extraArgs);
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
    // TODO private key 로 생성하기 
    const alice_private_key = new HexString(PRIVATE_KEY);
    const alice = new AptosAccount(alice_private_key.toUint8Array(),PUBLIC_ADDRESS);
    //const alice = new AptosAccount();

    // Print out account addresses.
    console.log("=== Addresses ===");
    console.log(`Alice: ${alice.address()}`);
    console.log("");

    // Fund accounts.
    // :!:>section_3
    await faucetClient.fundAccount(alice.address(), 100_000_000);

    console.log("=== Initial Coin Balances ===");
    console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
    console.log("");

    const collectionName = "Cannedbi NFT Collection #4";

    const collectionData = await tokenClient.getCollectionData(alice.address(), collectionName);
    console.log(`Cannedbi collection: ${JSON.stringify(collectionData, null, 4)}`); // <:!:section_6

    const maxMintCount = 1;

    for( let idx = 1; idx <= maxMintCount; idx++ ) {

        const tokenName = "Cannedbi #"+idx;
        //const description = "Cannedbi NFT #"+idx;



        const idxStr = zeroPad(idx, 4);
        const uri_cap = "ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/"+idxStr+".png";
        const uri_decap = "ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/"+idxStr+".png";



        await faucetClient.fundAccount(alice.address(), 100_000_000);
        console.log(`Balance: ${await coinClient.checkBalance(alice)}`);

        /// Mutate the token_properties of one token.
        //public fun mutate_one_token(

        // TODO 안된다 ㅎ 
        // let a = await mutateTokenProperties(
        //     client,tokenClient,
        //     alice,
        //     alice.address(),
        //     alice.address(),
        //     collectionName,
        //     tokenName,
        //     0,//tokenPropertyVersion,
        //     1,
        //     ["TOKEN_PROPERTY_MUTABLE","uri_cap","uri_decap","capped", "stat1", "stat2", "stat3", "stat4", "badge1"],
        //     [ BCS.bcsSerializeBool(true), 
        //       BCS.bcsSerializeStr(uri_cap), 
        //       BCS.bcsSerializeStr(uri_decap), 
        //       BCS.bcsSerializeBool(false), 
        //       BCS.bcsSerializeU8(1),
        //       BCS.bcsSerializeU8(1),
        //       BCS.bcsSerializeU8(1),
        //       BCS.bcsSerializeU8(1),
        //       BCS.bcsSerializeU16(1)
        //     ],
        //     ["bool","string","string","bool", "u8", "u8", "u8", "u8", "u16"],
        //   );
        // let b = await client.waitForTransactionWithResult(a);

        //console.log("mutate result:", b);
      
        // creator 에서 가져오는 것은 property_version 이랑 상관없이 가져오고,
        // TODO tokenData 에 largest_token_property_version 가 포함되어야 한다!
        const tokenData = await tokenClient.getTokenData(alice.address(), collectionName, tokenName);
        console.log(`Cannedbi token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8

        //const tokenPropertyVersion = tokenData.largest_token_property_version;
        const tokenPropertyVersion = 1;
        const tokenId = {
            token_data_id: {
                creator: alice.address().hex(),
                collection: collectionName,
                name: tokenName,
            },
            property_version: `${tokenPropertyVersion}`,
        };

        // 위에서 읽은 property_version 으로 account에 있는 것을 읽어와야 한다.
        const tokenData2 = await tokenClient.getTokenForAccount(alice.address(), tokenId);
        console.log(`Cannedbi token data: ${JSON.stringify(tokenData2, null, 4)}`); // <:!:section_8


    }

    
  
})();
