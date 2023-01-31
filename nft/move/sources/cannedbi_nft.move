module cannedbi_nft::create_nft {
    use std::bcs;
    
    use std::error;
    
    use std::signer;
    
    use std::string::{Self, String};
    use std::vector;

    use aptos_framework::account;
    use aptos_framework::account::SignerCapability;
    use aptos_framework::resource_account;
    
    use aptos_framework::event::{Self, EventHandle};
    
    use aptos_token::token::{Self,TokenDataId};
    
    // #[test_only]
    // use aptos_framework::account::create_account_for_test;

    // This struct stores the token receiver's address and token_data_id in the event of token minting
    struct TokenMintingEvent has drop, store {
        token_receiver_address: address,
        token_data_id: TokenDataId,
    }

    // This struct stores an NFT collection's relevant information
    struct ModuleData has key {
        signer_cap: account::SignerCapability,
        minting_enabled: bool,
        token_minting_events: EventHandle<TokenMintingEvent>,
        collection_name : String,
    }

    // This struct stores an NFT collection's relevant information
    // struct ModuleData has key {
    //     token_data_id: TokenDataId,
    // }

    /// Action not authorized because the signer is not the admin of this module
    const ENOT_AUTHORIZED: u64 = 1;
    /// The collection minting is disabled
    const EMINTING_DISABLED: u64 = 3;

    /// `init_module` is automatically called when publishing the module.
    /// In this function, we create an example NFT collection and an example token.
    fun init_module(resource_signer: &signer) {
        let collection_name = string::utf8(b"Cannedbi NFT Collection #1");
        let description = string::utf8(b"Cannedbi NFT Collection");
        let collection_uri = string::utf8(b"http://cannedbi.com");
        // This means that the supply of the token will not be tracked.
        let maximum_supply = 10000000000;
        // This variable sets if we want to allow mutation for collection description, uri, and maximum.
        let mutate_setting = vector<bool>[ true, true, true ];

        // Create the nft collection.
        token::create_collection(resource_signer, collection_name, description, collection_uri, maximum_supply, mutate_setting);

        // Retrieve the resource signer's signer capability and store it within the `ModuleData`.
        // Note that by calling `resource_account::retrieve_resource_account_cap` to retrieve the resource account's signer capability,
        // we rotate th resource account's authentication key to 0 and give up our control over the resource account. Before calling this function,
        // the resource account has the same authentication key as the source account so we had control over the resource account.
        let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, @source_addr);

        move_to(resource_signer, ModuleData {
            signer_cap: resource_signer_cap,
            minting_enabled: true,
            token_minting_events: account::new_event_handle<TokenMintingEvent>(resource_signer),
            collection_name : collection_name,
        });



    }

    /// Set if minting is enabled for this minting contract
    public entry fun set_minting_enabled(caller: &signer, minting_enabled: bool) acquires ModuleData {
        let caller_address = signer::address_of(caller);
        assert!(caller_address == @admin_addr, error::permission_denied(ENOT_AUTHORIZED));
        let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
        module_data.minting_enabled = minting_enabled;
    }

    /// Mint an NFT to the receiver(claimer).
    public entry fun mint(claimer: &signer) acquires ModuleData {
        let receiver_addr = signer::address_of(claimer);

        // get the collection minter and check if the collection minting is disabled or expired
        let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
        assert!(module_data.minting_enabled, error::permission_denied(EMINTING_DISABLED));

        // mint token to the receiver
        let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
        let resource_account_address = signer::address_of(&resource_signer);

        let token_name = string::utf8(b"Cannedbi NFT #1");
        let token_uri = string::utf8(b"http://cannedbi.com");
        let token_property_mutable = true;
        let uri_cap = string::utf8(b"http://cannedbi.com");
        let uri_decap = string::utf8(b"http://cannedbi.com");
        let capped = false;
        let stat1 = 1;
        let stat2 = 2;
        let stat3 = 3;
        let stat4 = 4;
        let badge1 = 1;
        // Create a token data id to specify the token to be minted.
        //  https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/aptos-token/sources/token.move
        let token_data_id = token::create_tokendata(
            &resource_signer,
            module_data.collection_name,
            token_name,
            string::utf8(b""), // description
            1,  // maximum supply
            token_uri, // uri
            resource_account_address,  // royalty receiver
            20, // royalty_points_denominator
            1, // royalty_points_numerator
            // This variable sets if we want to allow mutation for token maximum, uri, royalty, description, and properties.
            // Here we enable mutation for properties by setting the last boolean in the vector to true.
            token::create_token_mutability_config(
                &vector<bool>[false,true,false,false,true],// 1,uri,royalty,description, properies
            ),
            vector<String>[string::utf8(b"TOKEN_PROPERTY_MUTABLE"),
                string::utf8(b"uri_cap"),
                string::utf8(b"uri_decap"),
                string::utf8(b"capped"), 
                string::utf8(b"stat1"), 
                string::utf8(b"stat2"), 
                string::utf8(b"stat3"), 
                string::utf8(b"stat4"), 
                string::utf8(b"badge1")],
            vector<vector<u8>>[bcs::to_bytes<bool>(&token_property_mutable),
                bcs::to_bytes(&uri_cap),
                bcs::to_bytes(&uri_decap),
                bcs::to_bytes<bool>(&capped),
                bcs::to_bytes<u8>(&stat1),
                bcs::to_bytes<u8>(&stat2),
                bcs::to_bytes<u8>(&stat3),
                bcs::to_bytes<u8>(&stat4),
                bcs::to_bytes<u64>(&badge1)
            ],
            vector<String>[ string::utf8(b"bool") ,
                string::utf8(b"string"),
                string::utf8(b"string"),
                string::utf8(b"bool"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u64")
            ]
        );
        let token_id = token::mint_token(&resource_signer, token_data_id, 1);
        token::direct_transfer(&resource_signer, claimer, token_id, 1);

        event::emit_event<TokenMintingEvent>(
            &mut module_data.token_minting_events,
            TokenMintingEvent {
                token_receiver_address: receiver_addr,
                token_data_id: token_data_id,
            }
        );

    }

//
    // Tests
    //

    // #[test_only]
    // public fun set_up_test(
    //     origin_account: signer,
    //     resource_account: &signer,
    //     collection_token_minter_public_key: &ValidatedPublicKey,
    //     aptos_framework: signer,
    //     nft_receiver: &signer,
    //     timestamp: u64
    // ) acquires ModuleData {
    //     // set up global time for testing purpose
    //     timestamp::set_time_has_started_for_testing(&aptos_framework);
    //     timestamp::update_global_time_for_test_secs(timestamp);

    //     create_account_for_test(signer::address_of(&origin_account));

    //     // create a resource account from the origin account, mocking the module publishing process
    //     resource_account::create_resource_account(&origin_account, vector::empty<u8>(), vector::empty<u8>());

    //     init_module(resource_account);

    //     let admin = create_account_for_test(@admin_addr);
    //     //let pk_bytes = ed25519::validated_public_key_to_bytes(collection_token_minter_public_key);
    //     //set_public_key(&admin, pk_bytes);

    //     create_account_for_test(signer::address_of(nft_receiver));
    // }

}