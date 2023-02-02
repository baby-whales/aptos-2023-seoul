// getCurrentTokenOwnership_by_collection.js

import fetch from "node-fetch";

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    "https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql",
    {
        method: "POST",
        body: JSON.stringify({
            query: operationsDoc,
            variables: variables,
            operationName: operationName
        })
    }
    );

    return await result.json();
}

const operationsDoc = `
    query getCurrentTokenOwnership($_owner: String = "", $_collection: String = "") {
        current_token_ownerships(
            where: {owner_address: {_eq: $_owner}, collection_name: {_eq: $_collection}}
        ) {
            amount
            creator_address
            collection_name
            collection_data_id_hash
            token_properties
            token_data_id_hash
            table_type
            property_version
            owner_address
            name
            last_transaction_timestamp
            last_transaction_version
        }
    }
`;

function fetchGetCurrentTokenOwnership(_owner, _collection) {
    return fetchGraphQL(
        operationsDoc,
        "getCurrentTokenOwnership",
        {"_owner": _owner, "_collection": _collection}
    );
}

async function startFetchGetCurrentTokenOwnership(_owner, _collection) {
    const { errors, data } = await fetchGetCurrentTokenOwnership(_owner, _collection);

    if (errors) {
        console.error(errors);
    }

    console.log(data);
}

startFetchGetCurrentTokenOwnership("<OWNER_ADDRESS_HERE>", "<TOKEN_COLLECTION_NAME_HERE>");