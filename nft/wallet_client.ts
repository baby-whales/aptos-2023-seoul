

//import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS  } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS  } from "./dist/index";
import { HexString,MaybeHexString } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
import { NODE_URL, FAUCET_URL } from "./common";
import * as Gen from "./generated";

// export interface TxnRequestRaw {
//     sender: MaybeHexString;
//     payload: Gen.EntryFunctionPayload;
//     options?: Partial<Gen.SubmitTransactionRequest>;
// }

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


}

