// getCurrentTokenOwnership.js

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
    query getCurrentTokenOwnership($_owner: String = "") {
        current_token_ownerships(where: {owner_address: {_eq: $_owner}}) {
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

function fetchGetCurrentTokenOwnership(_owner) {
    return fetchGraphQL(
        operationsDoc,
        "getCurrentTokenOwnership",
        { "_owner": _owner }
    );
}

async function startFetchGetCurrentTokenOwnership(_owner) {
    const { errors, data } = await fetchGetCurrentTokenOwnership(_owner);

    if (errors) {
        console.error(errors);
    }

    console.log(data);
}

startFetchGetCurrentTokenOwnership("<OWNER_ADDRESS_HERE>");