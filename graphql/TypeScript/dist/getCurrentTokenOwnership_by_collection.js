"use strict";
// getCurrentTokenOwnership_by_collection.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = __importDefault(require("node-fetch"));
function fetchGraphQL(operationsDoc, operationName, variables) {
    return (0, node_fetch_1.default)("https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql", {
        method: 'POST',
        body: JSON.stringify({
            query: operationsDoc,
            variables: variables,
            operationName: operationName,
        }),
    }).then(function (result) { return result.json(); });
}
var operation = "\n    query getCurrentTokenOwnership($_owner: String = \"\", $_collection: String = \"\") {\n      current_token_ownerships(\n        where: {owner_address: {_eq: $_owner}, collection_name: {_eq: $_collection}}\n      ) {\n        amount\n        creator_address\n        collection_name\n        collection_data_id_hash\n        token_properties\n        token_data_id_hash\n        table_type\n        property_version\n        owner_address\n        name\n        last_transaction_timestamp\n        last_transaction_version\n      }\n    }\n  ";
function fetchgetCurrentTokenOwnership() {
    return fetchGraphQL(operation, "getCurrentTokenOwnership", { "_owner": "<OWNER_ADDRESS_HERE>", "_collection": "<TOKEN_COLLECTION_NAME_HERE>" });
}
fetchgetCurrentTokenOwnership()
    .then(function (_a) {
    var data = _a.data, errors = _a.errors;
    if (errors) {
        console.error(errors);
    }
    console.log(data.current_token_ownerships[0].collection_name);
    console.log(data);
    console.log("");
    console.log("");
})
    .catch(function (error) {
    console.error(error);
});
