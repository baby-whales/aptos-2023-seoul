module cannedbi_nft::create_nft {
    use std::bcs;
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    use aptos_token::token;
    use aptos_token::token::TokenDataId;

    // This struct stores an NFT collection's relevant information
    // struct ModuleData has key {
    //     token_data_id: TokenDataId,
    // }

    /// Action not authorized because the signer is not the admin of this module
    const ENOT_AUTHORIZED: u64 = 1;

    /// `init_module` is automatically called when publishing the module.
    /// In this function, we create an example NFT collection and an example token.
    fun init_module(source_account: &signer) {
        let collection_name = string::utf8(b"Cannedbi NFT Collection #1");
        let description = string::utf8(b"Cannedbi NFT Collection");
        let collection_uri = string::utf8(b"http://cannedbi.com");
        // This means that the supply of the token will not be tracked.
        let maximum_supply = 10000000000;
        // This variable sets if we want to allow mutation for collection description, uri, and maximum.
        let mutate_setting = vector<bool>[ true, true, true ];

        // Create the nft collection.
        token::create_collection(source_account, collection_name, description, collection_uri, maximum_supply, mutate_setting);

    }

}