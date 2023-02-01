

//import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS  } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS  } from "./dist/index";
import { ApiError as AptosApiError } from "./dist/index";
import { Types as AptosTypes } from "./dist/index";
import { HexString,MaybeHexString } from "./dist/index";
import { NODE_URL, FAUCET_URL } from "./common";
import * as Gen from "./generated";
import { AnyNumber, Bytes, Uint8 , Uint16 } from "./bcs";
import { AnyMxRecord } from "dns";
//import { TransactionBuilder, TransactionBuilderABI, TxnBuilderTypes } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
//import { PendingTransaction } from "./dist/index" 

import { CAN_COIN_ADDRESS , CANNEDBI_NFT_ADDRESS } from "./common"

// export interface TxnRequestRaw {
//     sender: MaybeHexString;
//     payload: Gen.EntryFunctionPayload;
//     options?: Partial<Gen.SubmitTransactionRequest>;
// }
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export interface TokenId {
    property_version: string;
    token_data_id: {
        creator: string;
        collection: string;
        name: string;
    };
}

export interface AccountMetaData {
    derivationPath: string;
    address: string;
    publicKey?: string;
}
  
export interface Wallet {
    code: string; // mnemonic
    accounts: AccountMetaData[];
}

export enum CoinType {
  APTOS = "AptosCoin", // native coin
  // coin that bridge supports, same to bridge::coin module
  WETH = "WETH",
  WBTC = "WBTC",

  USDC = "USDC",
  USDT = "USDT",
  BUSD = "BUSD",
  USDD = "USDD",
  CAN = "CAN",
}

export const supportedTypes = [CoinType.WETH, CoinType.WBTC, CoinType.USDC, CoinType.USDT, CoinType.BUSD, CoinType.USDD]

export function isErrorOfApiError(e: any, status: number) {
  if (e instanceof AptosApiError) {
      return e.status === status
  } else if (e instanceof AptosTypes.ApiError) {
      return e.status === status
  } else if (e instanceof Error && e.constructor.name.match(/ApiError[0-9]*/)) {
      if (Object.prototype.hasOwnProperty.call(e, "vmErrorCode")) {
          const err = e as AptosApiError
          return err.status === status
      } else if (Object.prototype.hasOwnProperty.call(e, "request")) {
          const err = e as AptosTypes.ApiError
          return err.status === status
      }
  } else if (e instanceof Error) {
      if (Object.prototype.hasOwnProperty.call(e, "status")) {
          return (e as any).status === status
      }
  }
  return false
}

export class WalletClient {
    faucetClient: FaucetClient;

    aptosClient: AptosClient;

    tokenClient: TokenClient;

    constructor(node_url :string , faucet_url :string ) {
        this.faucetClient = new FaucetClient(node_url, faucet_url);
        this.aptosClient = new AptosClient(node_url);
        this.tokenClient = new TokenClient(this.aptosClient);
    }

    /* eslint-enable */

    async getEventStream(
    address: string,
    eventHandleStruct: string,
    fieldName: string,
    limit?: number,
    start?: number
    ) {
        let endpointUrl = `${this.aptosClient.nodeUrl}/accounts/${address}/events/${eventHandleStruct}/${fieldName}`;
        if (limit) {
            endpointUrl += `?limit=${limit}`;
        }

        if (start) {
            endpointUrl += limit ? `&start=${start}` : `?start=${start}`;
        }

        const response = await fetch(endpointUrl, {
            method: "GET",
        });

        if (response.status === 404) {
            return [];
        }

        return Promise.resolve(await response.json());
    }

    /**
     * returns the account resources of type "0x3::token::TokenStore"
     *
     * @param address address of the desired account
     * @returns tokenStore Resources
     */
    async getTokenStoreResources(address: string) {
        const tokenStoreResources = await this.aptosClient.getAccountResource(
            address,
            "0x3::token::TokenStore"
        );
        return tokenStoreResources;
    }
    /**
   * returns a list of token IDs of the tokens in a user's account
   * (including the tokens that were minted)
   *
   * @param address address of the desired account
   * @returns list of token IDs
   */
  async getTokenIds(
    address: string,
    limit?: number,
    depositStart?: number,
    withdrawStart?: number
  ) {
    const countDeposit = {};
    const countWithdraw = {};
    const elementsFetched = new Set();
    const tokenIds = [];

    const depositEvents = await this.getEventStream(
      address,
      "0x3::token::TokenStore",
      "deposit_events",
      limit,
      depositStart
    );

    const withdrawEvents = await this.getEventStream(
      address,
      "0x3::token::TokenStore",
      "withdraw_events",
      limit,
      withdrawStart
    );

    let maxDepositSequenceNumber = -1;
    let maxWithdrawSequenceNumber = -1;

    depositEvents.forEach((element) => {
      const elementString = JSON.stringify(element.data.id);
      elementsFetched.add(elementString);
      countDeposit[elementString] = countDeposit[elementString]
        ? {
            count: countDeposit[elementString].count + 1,
            sequence_number: element.sequence_number,
            data: element.data.id,
          }
        : {
            count: 1,
            sequence_number: element.sequence_number,
            data: element.data.id,
          };

      maxDepositSequenceNumber = Math.max(
        maxDepositSequenceNumber,
        parseInt(element.sequence_number, 10)
      );
    });

    withdrawEvents.forEach((element) => {
      const elementString = JSON.stringify(element.data.id);
      elementsFetched.add(elementString);
      countWithdraw[elementString] = countWithdraw[elementString]
        ? {
            count: countWithdraw[elementString].count + 1,
            sequence_number: element.sequence_number,
            data: element.data.id,
          }
        : {
            count: 1,
            sequence_number: element.sequence_number,
            data: element.data.id,
          };

      maxWithdrawSequenceNumber = Math.max(
        maxWithdrawSequenceNumber,
        parseInt(element.sequence_number, 10)
      );
    });

    if (elementsFetched) {
      Array.from(elementsFetched).forEach((elementString: string) => {
        const depositEventCount = countDeposit[elementString]
          ? countDeposit[elementString].count
          : 0;
        const withdrawEventCount = countWithdraw[elementString]
          ? countWithdraw[elementString].count
          : 0;
        tokenIds.push({
          data: countDeposit[elementString]
            ? countDeposit[elementString].data
            : countWithdraw[elementString].data,
          deposit_sequence_number: countDeposit[elementString]
            ? countDeposit[elementString].sequence_number
            : "-1",
          withdraw_sequence_number: countWithdraw[elementString]
            ? countWithdraw[elementString].sequence_number
            : "-1",
          difference: depositEventCount - withdrawEventCount,
        });
      });
    }
    return { tokenIds, maxDepositSequenceNumber, maxWithdrawSequenceNumber };
  }

  /**
   * returns the tokens in an account
   *
   * @param address address of the desired account
   * @returns list of tokens and their collection data
   */
  async getTokens(
    address: string,
    limit?: number,
    depositStart?: number,
    withdrawStart?: number
  ) {
    const { tokenIds } = await this.getTokenIds(
      address,
      limit,
      depositStart,
      withdrawStart
    );
    console.log("tokenIds:" + tokenIds);

    const tokens = [];
    await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          let resources: Gen.MoveResource[];
          
            resources = await this.aptosClient.getAccountResources(
                tokenId.data.token_data_id.creator
            );
            

          const accountResource: { type: string; data: any } = resources.find(
            (r) => r.type === "0x3::token::Collections"
          );
          const tableItemRequest: Gen.TableItemRequest = {
            key_type: "0x3::token::TokenDataId",
            value_type: "0x3::token::TokenData",
            key: tokenId.data.token_data_id,
          };

          const cacheKey = JSON.stringify(tableItemRequest);

          let token: any;
          
            token = await this.aptosClient.getTableItem(
              accountResource.data.token_data.handle,
              tableItemRequest
            );
            
          console.log(`getTableItem: ${JSON.stringify(token, null, 4)}`);
    

          token.collection = tokenId.data.token_data_id.collection;
          tokens.push({ token, sequence_number: tokenId.sequence_number });
        } catch (e) {
          // Errors happening because of token handle not found will lead here
        }
      })
    );

    return tokens;
  }

  /**
   * returns the token information (including the collection information)
   * about a said tokenID
   *
   * @param tokenId token ID of the desired token
   * @returns token information
   */
  async getToken(tokenId: TokenId, resourceHandle?: string) {
    let accountResource: { type: string; data: any };
    if (!resourceHandle) {
      const resources: Gen.MoveResource[] =
        await this.aptosClient.getAccountResources(
          tokenId.token_data_id.creator
        );
      accountResource = resources.find(
        (r) => r.type === "0x3::token::Collections"
      );
    }

    const tableItemRequest: Gen.TableItemRequest = {
      key_type: "0x3::token::TokenDataId",
      value_type: "0x3::token::TokenData",
      key: tokenId.token_data_id,
    };
    const token = await this.aptosClient.getTableItem(
      resourceHandle || accountResource.data.token_data.handle,
      tableItemRequest
    );
    token.collection = tokenId.token_data_id.collection;

    return token;
  }

  async getTokenProperties(tokenId: TokenId, address: string) {
    const resources: Gen.MoveResource[] =
      await this.aptosClient.getAccountResources(address);
    const accountResource: any = resources.find(
      (r) => r.type === "0x3::token::TokenStore"
    );

    const tableItemRequestForPropertiesData: Gen.TableItemRequest = {
      key_type: "0x3::token::TokenId",
      value_type: "0x3::token::Token",
      key: tokenId,
    };

    const tokenPropertiesData = await this.aptosClient.getTableItem(
      accountResource.data.tokens.handle,
      tableItemRequestForPropertiesData
    );

    return tokenPropertiesData;
  }

  /**
   * returns the resource handle for type 0x3::token::Collections
   * about a said creator
   *
   * @param tokenId token ID of the desired token
   * @returns resource information
   */
  async getTokenResourceHandle(tokenId: TokenId) {
    const resources: Gen.MoveResource[] =
      await this.aptosClient.getAccountResources(tokenId.token_data_id.creator);
    const accountResource: { type: string; data: any } = resources.find(
      (r) => r.type === "0x3::token::Collections"
    );

    return accountResource.data.token_data.handle;
  }

  /**
   * returns the information about a collection of an account
   *
   * @param address address of the desired account
   * @param collectionName collection name
   * @returns collection information
   */
  async getCollection(address: string, collectionName: string) {
    const resources: Gen.MoveResource[] =
      await this.aptosClient.getAccountResources(address);
    const accountResource: { type: string; data: any } = resources.find(
      (r) => r.type === "0x3::token::Collections"
    );

    const tableItemRequest: Gen.TableItemRequest = {
      key_type: "0x1::string::String",
      value_type: "0x3::token::Collection",
      key: collectionName,
    };
    const collection = await this.aptosClient.getTableItem(
      accountResource.data.collections.handle,
      tableItemRequest
    );
    return collection;
  }

  
  getCoinType(coin: CoinType): string {
    switch (coin) {
        case CoinType.APTOS:
            return `0x1::aptos_coin::${coin}`
        case CoinType.CAN:
          return `${CAN_COIN_ADDRESS}::can_coin::CanCoin`
        // default:
        //     return `${this.bridge}::asset::${coin}`
    }
  }
  //0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
  //"type": "0x1::coin::CoinStore<0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin>",
    
  //"type": "0x1::coin::CoinStore<0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin>"

  // async isAccountCanCoinRegistered(accountAddr: string,coin: CoinType): Promise<boolean> {
  //   try {
  //       await this.aptosClient.getAccountResource(accountAddr, 
  //       "0x1::coin::CoinStore<0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin>")
  //       return true
  //   } catch (e) {
  //       if (isErrorOfApiError(e, 404)) {
  //           return false
  //       }
  //       throw e
  //   }
  // }

  async isAccountRegistered(accountAddr: string,coin: CoinType): Promise<boolean> {
    const coinType : string = `0x1::coin::CoinStore<${this.getCoinType(coin)}>`;
    console.log("coin type:",coinType);
    //const coinType2 = "0x1::coin::CoinStore<0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin>";
    //console.log("coin type:",coinType2);    
    //console.log("diff:",coinType == coinType2);
    
    try {
        await this.aptosClient.getAccountResource(accountAddr, 
          coinType)
        return true
    } catch (e) {
        if (isErrorOfApiError(e, 404)) {
            return false
        }
        throw e
    }
  }

  async managedRegisterToken(
    account: AptosAccount,
    //receiverAddress: MaybeHexString,
    coin: CoinType
  ): Promise<string> {
    //const addr = "0x1::managed_coin::register";
    const coinType = this.getCoinType(coin);
    console.log("registerToken coin type:",coinType);

    const rawTxn = await this.aptosClient.generateTransaction(account.address(), {
        function: "0x1::managed_coin::register",
        type_arguments: [coinType],
        arguments: [],
      });
  
    const bcsTxn = await this.aptosClient.signTransaction(account, rawTxn);
    const pendingTxn = await this.aptosClient.submitTransaction(bcsTxn);
  
    return pendingTxn.hash;
  }
  //"type": "0x1::managed_coin::Capabilities<0xf51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34::can_coin::CanCoin>",
  // https://github.com/aptosis/aptos-framework/blob/019e555/packages/aptos-framework/src/managed_coin/index.ts#L10
  // https://github.com/aptos-labs/aptos-core/blob/main/ecosystem/typescript/sdk/examples/typescript/your_coin.ts

  async managedMintToken(
    account: AptosAccount,
    receiverAddress: MaybeHexString,
    coin: CoinType,
    amount: AnyNumber,
  ): Promise<string> {
    const addr = "0x1::managed_coin::mint";
    const coinType = this.getCoinType(coin);
    console.log("managedMintToken coin type:",coinType);

    const rawTxn = await this.aptosClient.generateTransaction(account.address(), {
        function: "0x1::managed_coin::mint",
        type_arguments: [coinType],
        arguments: [receiverAddress, amount],
      });
  
    const bcsTxn = await this.aptosClient.signTransaction(account, rawTxn);
    const pendingTxn = await this.aptosClient.submitTransaction(bcsTxn);
  
    return pendingTxn.hash;
  }

  // public entry fun init_collection(
  //   account: &signer,
  //   royalty_payee_address:address,
  //   collection_name: String,
  //   collection_description: String,
  //   collection_uri: String,
  //   seeds: vector<u8>
  async cannedbiCreateCollection(
    account: AptosAccount,
    royalty_payee_address: MaybeHexString,
    collection_name: String,
    collection_description: String,
    collection_uri : String): Promise<string> {
    const funcName = `${CANNEDBI_NFT_ADDRESS}::character::init_collection`;
    
    const seed = ""+makeid(5);

    const rawTxn = await this.aptosClient.generateTransaction(account.address(), {
        function: funcName,
        type_arguments: [],
        arguments: [royalty_payee_address, collection_name,collection_description,
          collection_uri,seed],
      });
  
    const bcsTxn = await this.aptosClient.signTransaction(account, rawTxn);
    const pendingTxn = await this.aptosClient.submitTransaction(bcsTxn);
  
    //this.aptosClient.waitForTransactionWithResult(pendingTxn.hash, { checkSuccess : true});
    const results = await this.aptosClient.waitForTransactionWithResult(pendingTxn.hash);
    console.log("cannedbiCreateCollection results:",results);

    //const addr = results['changes'][2]['address'];
    //console.log("cannedbiCreateCollection token_machine_addr:",addr);

    return pendingTxn.hash;
  }

  // public entry fun create_token(creator: &signer,
  //   token_name : string::String,
  //   description : string::String,
  //   token_uri : string::String,
  //   uri_cap : string::String,
  //   uri_decap : string::String,
  //   stat1 :u8,stat2 :u8,stat3 :u8,stat4 :u8)
  async cannedbiCreateToken(
    account: AptosAccount,
    token_machine: MaybeHexString,
    token_name: String,
    description: String,
    token_uri : String,
    uri_cap : String,
    uri_decap : String,
    stat1 : Uint8,stat2: Uint8,stat3: Uint8,stat4: Uint8): Promise<string> {
    const funcName = `${CANNEDBI_NFT_ADDRESS}::character::mint_script`;
    
    const rawTxn = await this.aptosClient.generateTransaction(account.address(), {
        function: funcName,
        type_arguments: [],
        arguments: [token_machine,token_name, description,token_uri,uri_cap,uri_decap,
          stat1,stat2,stat3,stat4],
      });
  
    const bcsTxn = await this.aptosClient.signTransaction(account, rawTxn);
    const pendingTxn = await this.aptosClient.submitTransaction(bcsTxn);
  
    return pendingTxn.hash;
  }
}

