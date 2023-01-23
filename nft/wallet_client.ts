

import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient, BCS  } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
import { HexString,MaybeHexString } from "../../aptos-core/ecosystem/typescript/sdk/dist/index";
import { NODE_URL, FAUCET_URL } from "./common";
//import * as BCS from "./bcs";
//import * as Gen from "../../aptos-core/ecosystem/typescript/sdk/dist/index";

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
}

