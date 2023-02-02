// getCurrentTokenOwnership.ts

import fetch from "node-fetch";

function fetchGraphQL(
  operationsDoc: string,
  operationName: string,
  variables: Record<string, any>
) {
  return fetch("https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql", {
    method: 'POST',
    body: JSON.stringify({
      query: operationsDoc,
      variables,
      operationName,
    }),
  }).then(result => result.json());
}

const operation = `
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

function fetchgetCurrentTokenOwnership() {
  return fetchGraphQL(operation, "getCurrentTokenOwnership", { "_owner": "<OWNER_ADDRESS_HERE>" })
}

fetchgetCurrentTokenOwnership()
  .then(({ data, errors }) => {
    if (errors) {
      console.error(errors);
    }
    console.log(data);
  })
  .catch(error => {
    console.error(error);
  });
