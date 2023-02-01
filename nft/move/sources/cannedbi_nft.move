// objective : create a Character NFT collection and mint NFTs 
module cannedbi_nft::character {
    use std::bcs;
    //use aptos_std::from_bcs;
    //use std::hash;

    //use std::error;
    
    use std::signer;
    
    use std::string::{Self, String};
    
    use aptos_framework::account;
    //use aptos_framework::account::SignerCapability;
    
    
    //use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::event::{EventHandle};
    

    use aptos_token::token::{Self,TokenDataId};
    
    //use aptos_framework::coin;
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::AptosCoin;

    #[test_only]
    //use aptos_framework::account::create_account_for_test;
    //use aptos_framework::timestamp;
    //use aptos_framework::resource_account;
    //use std::vector;
    use aptos_std::debug;

    // This struct stores the token receiver's address and token_data_id in the event of token minting
    struct TokenMintingEvent has drop, store {
        token_receiver_address: address,
        token_data_id: TokenDataId,
    }

    // This struct stores an NFT collection's relevant information
    // todo to parallelize the minting process, we need to store the information separately.
    struct ModuleData has key {
        signer_cap: account::SignerCapability,    
        minting_enabled: bool,
        token_minting_events: EventHandle<TokenMintingEvent>,
        collection_name : String,
        total_supply: u64,
        minted: u64,
        mint_price: u64,
    }

    struct ResourceInfo has key {
        source: address,
        resource_cap: account::SignerCapability
    }

    struct TokenMachine has key {
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        royalty_payee_address:address,
        royalty_points_denominator: u64,
        royalty_points_numerator: u64,
        mint_price: u64,
        paused: bool,
        max_supply : u64,// total supply  < max_supply
        total_supply: u64,
        minted: u64,
        token_mutate_setting:vector<bool>,
    }

    /// Action not authorized because the signer is not the admin of this module
    const ENOT_AUTHORIZED: u64 = 1;
    /// The collection minting is disabled
    const EMINTING_DISABLED: u64 = 3;
    /// The collection is sold out
    const ESOLD_OUT:u64 = 5;
    /// minting is paused
    const EPAUSED:u64 = 6;
    /// minting limit is exceeded
    const MINT_LIMIT_EXCEED: u64 = 9;

    // const INVALID_SIGNER: u64 = 0;
    // const INVALID_amount: u64 = 1;
    // const CANNOT_ZERO: u64 = 2;
    // const EINVALID_ROYALTY_NUMERATOR_DENOMINATOR: u64 = 3;
    // const ESALE_NOT_STARTED: u64 = 4;
    // const ESOLD_OUT:u64 = 5;
    // const EPAUSED:u64 = 6;
    // const INVALID_MUTABLE_CONFIG:u64 = 7;
    // const EINVALID_MINT_TIME:u64 = 8;
    // const MINT_LIMIT_EXCEED: u64 = 9;

    public entry fun init_collection(
        account: &signer,
        royalty_payee_address:address,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        seeds: vector<u8>
    ){
        let (_resource, resource_cap) = account::create_resource_account(account, seeds);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_cap);
        //let now = aptos_framework::timestamp::now_seconds();
        move_to<ResourceInfo>(&resource_signer_from_cap, ResourceInfo{resource_cap: resource_cap, source: signer::address_of(account)});
        let collection_mutate_setting = vector<bool>[true, true, true];//collection description, uri, and maximum.
        let token_mutate_setting = vector<bool>[false,true,false,false,true];//1,uri,royalty,description, properies

        move_to<TokenMachine>(&resource_signer_from_cap, TokenMachine{
            collection_name,
            collection_description,
            collection_uri,
            royalty_payee_address,
            royalty_points_denominator:100,
            royalty_points_numerator:1,
            mint_price:1000,
            paused:false,
            max_supply:10000000000,
            total_supply:2727,
            minted:0,
            token_mutate_setting,
        });
        token::create_collection(
            &resource_signer_from_cap, 
            collection_name, 
            collection_description, 
            collection_uri, 
            2727,//maximum
            collection_mutate_setting
        );
    }

    #[test_only]
    public fun set_up_test(
        creator: &signer,
        aptos_framework: &signer,
        minter: &signer,
        token_machine: &signer,
        timestamp: u64 )
    {
        account::create_account_for_test(signer::address_of(creator));
        account::create_account_for_test(signer::address_of(minter));
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(aptos_framework);
        coin::register<0x1::aptos_coin::AptosCoin>(minter);
        coin::register<0x1::aptos_coin::AptosCoin>(creator);
        coin::deposit(signer::address_of(minter), coin::mint(1000, &mint_cap));
        coin::deposit(signer::address_of(creator), coin::mint(100, &mint_cap));
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
        aptos_framework::timestamp::set_time_has_started_for_testing(token_machine);
        aptos_framework::timestamp::update_global_time_for_test_secs(timestamp);
        init_collection(
                creator,
                signer::address_of(creator),
                string::utf8(b"Cannedbi Aptos NFT Collection #1"),
                string::utf8(b"Awesome Cannedbi Aptos NFT Collection"),
                string::utf8(b"https://cannedbi.com"),
                b"cannedbi"
            );
    }

    public entry fun mint_script(
        receiver: &signer,
        token_machine: address,
        token_name : string::String,
        description : string::String,
        token_uri : string::String,
        uri_cap : string::String,
        uri_decap : string::String,
        stat1 :u8,stat2 :u8,stat3 :u8,stat4 :u8

    ) acquires ResourceInfo, TokenMachine {
        let receiver_addr = signer::address_of(receiver);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_data.resource_cap);
        let token_machine_data = borrow_global_mut<TokenMachine>(token_machine);
        assert!(token_machine_data.paused == false, EPAUSED);
        assert!(token_machine_data.minted != token_machine_data.total_supply, ESOLD_OUT);

        let token_property_mutable = true;
        let capped = false;
        let level = 1;
        let properties_name = vector<String>[string::utf8(b"TOKEN_PROPERTY_MUTABLE"),
                string::utf8(b"uri_cap"),
                string::utf8(b"uri_decap"),
                string::utf8(b"capped"), 
                string::utf8(b"stat1"), 
                string::utf8(b"stat2"), 
                string::utf8(b"stat3"), 
                string::utf8(b"stat4"), 
                string::utf8(b"level")];
        let properties_value = vector<vector<u8>>[bcs::to_bytes<bool>(&token_property_mutable),
                bcs::to_bytes(&uri_cap),
                bcs::to_bytes(&uri_decap),
                bcs::to_bytes<bool>(&capped),
                bcs::to_bytes<u8>(&stat1),
                bcs::to_bytes<u8>(&stat2),
                bcs::to_bytes<u8>(&stat3),
                bcs::to_bytes<u8>(&stat4),
                bcs::to_bytes<u64>(&level)
            ];
        let properties_type = vector<String>[ string::utf8(b"bool") ,
                string::utf8(b"string"),
                string::utf8(b"string"),
                string::utf8(b"bool"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u8"),
                string::utf8(b"u64")
            ];
        let token_mut_config = token::create_token_mutability_config(&token_machine_data.token_mutate_setting);
        token::create_tokendata(
            &resource_signer_from_cap,
            token_machine_data.collection_name,
            token_name,
            description,
            1,// maximum supply
            token_uri,// token uri
            token_machine_data.royalty_payee_address,
            token_machine_data.royalty_points_denominator,
            token_machine_data.royalty_points_numerator,
            token_mut_config,
            properties_name,
            properties_value,
            properties_type
        );

        let token_data_id = token::create_token_data_id(token_machine,
            token_machine_data.collection_name,token_name);
        token::opt_in_direct_transfer(receiver,true);
        let mint_price = token_machine_data.mint_price;
        coin::transfer<AptosCoin>(receiver, resource_data.source, mint_price);
        token::mint_token_to(
            &resource_signer_from_cap,
            receiver_addr,
            token_data_id,
            1
            );
        token_machine_data.minted=token_machine_data.minted+1
    }

    #[test]
    public entry fun test1() {
        debug::print_stack_trace();
    }

    #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    public entry fun test_token_machine1(
            creator: &signer,
            aptos_framework: &signer,
            minter: &signer,
            token_machine: &signer
        ) //,TokenMachine
    {
            set_up_test(creator,aptos_framework,minter,token_machine,80);
            aptos_framework::timestamp::update_global_time_for_test_secs(102);
            //let whitelist_address= vector<address>[signer::address_of(minter)];
            //let mint_limit= 1;
            //let token_machine = account::create_resource_address(&signer::address_of(creator), b"cannedbi");
    }

    #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    public entry fun test_token_machine2(
            creator: &signer,
            aptos_framework: &signer,
            minter: &signer,
            token_machine: &signer
        ) acquires ResourceInfo,TokenMachine
    {
            set_up_test(creator,aptos_framework,minter,token_machine,80);
            aptos_framework::timestamp::update_global_time_for_test_secs(102);
            //let whitelist_address= vector<address>[signer::address_of(minter)];
            //let mint_limit= 1;
            //let token_machine = account::create_resource_address(&signer::address_of(creator), b"cannedbi")
            let token_machine_addr = account::create_resource_address(&signer::address_of(creator), b"cannedbi");

            let uri = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0001.png");
            let uri_cap = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0001.png");
            let uri_decap = string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0001.png");
            let stat1 = 1;
            let stat2 = 2;
            let stat3 = 3;
            let stat4 = 4;


            mint_script(
                minter,
                token_machine_addr,
                string::utf8(b"Cannedbi NFT #1"),//token_name : string::String,
                string::utf8(b"Awesome Cannedbi NFT #1"),//description : string::String,
                uri,//token_uri : string::String,
                uri_cap,//uri_cap : string::String,
                uri_decap,//uri_decap : string::String,
                stat1,stat2,stat3,stat4
            );
    }

    // `init_module` is automatically called when publishing the module.
    // In this function, we create an NFT collection 
    // fun init_module(creator_signer: &signer) {
    //     let collection_name = string::utf8(b"Cannedbi Aptos NFT Collection #1");
    //     let description = string::utf8(b"Cannedbi Aptos NFT Collection");
    //     let collection_uri = string::utf8(b"http://cannedbi.com");
    //     // This means that the supply of the token will not be tracked.
    //     let maximum_supply = 10000000000;
    //     let total_supply = 2727;
    //     // This variable sets if we want to allow mutation for collection description, uri, and maximum.
    //     let mutate_setting = vector<bool>[ true, true, true ];


    //     // store the token data id within the module, so we can refer to it later
    //     // when we're minting the NFT
    //     let (_resource, resource_cap) = account::create_resource_account(creator_signer,  x"2727");
    //     let resource_signer_from_cap = account::create_signer_with_capability(&resource_cap);
    //     //let now = aptos_framework::timestamp::now_seconds();

    //     //let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_signer, @cannedbi_nft);
    //     // move_to<ResourceInfo>(&resource_signer_from_cap, 
    //     //     ResourceInfo{signer_cap: resource_signer_cap, 
    //     //     source: @source_addr});
        
    //     move_to(&resource_signer_from_cap, ModuleData {
    //         signer_cap: resource_cap,
    //         minting_enabled: true,
    //         token_minting_events: account::new_event_handle<TokenMintingEvent>(creator_signer),
    //         collection_name : collection_name,
    //         total_supply : total_supply,
    //         minted : 0,
    //         mint_price : 500,
    //     });

    //     // Create the nft collection.
    //     token::create_collection(&resource_signer_from_cap, 
    //         collection_name, description, collection_uri, maximum_supply, mutate_setting);


    // }

    // Set if minting is enabled for this minting contract
    // public entry fun set_minting_enabled(caller: &signer, minting_enabled: bool) acquires ModuleData {
    //     let caller_address = signer::address_of(caller);
    //     assert!(caller_address == @admin_addr, error::permission_denied(ENOT_AUTHORIZED));
    //     let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
    //     module_data.minting_enabled = minting_enabled;
    // }

    // Create and Mint an NFT to the receiver(creator). -> not tested yet
    // Only the admin of this module can call this function. -> not tested
    // public entry fun create_token(creator: &signer,
    //     token_name : string::String,
    //     description : string::String,
    //     token_uri : string::String,
    //     uri_cap : string::String,
    //     uri_decap : string::String,
    //     stat1 :u8,stat2 :u8,stat3 :u8,stat4 :u8) acquires ModuleData {

    //     let receiver_addr = signer::address_of(creator);
    //     //assert!(receiver_addr == @admin_addr, error::permission_denied(ENOT_AUTHORIZED));

    //     // get the collection minter and check if the collection minting is disabled or expired
    //     let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
    //     //let module_data = borrow_global_mut<ModuleData>(receiver_addr);
    //     //assert!(module_data.minting_enabled, error::permission_denied(EMINTING_DISABLED));

    //     //assert!(module_data.minted != module_data.total_supply, error::permission_denied(ESOLD_OUT));

    //     // mint token to the receiver
    //     //let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    //     //let resource_account_address = signer::address_of(&resource_signer);

    //     //let remaining = module_data.total_supply - module_data.minted;
    //     //let random_index = pseudo_random(receiver_addr,remaining);

    //     //let token_name = string::utf8(b"Cannedbi NFT #1");
    //     //let token_uri = string::utf8(b"http://cannedbi.com");
    //     let token_property_mutable = true;
    //     //let uri_cap = string::utf8(b"http://cannedbi.com");
    //     //let uri_decap = string::utf8(b"http://cannedbi.com");
    //     let capped = false;
    //     //let stat1 = pseudo_random_u8(receiver_addr,10);
    //     //let stat2 = pseudo_random_u8(receiver_addr,10);
    //     //let stat3 = pseudo_random_u8(receiver_addr,10);
    //     //let stat4 = pseudo_random_u8(receiver_addr,10);
    //     let level = 0;
    //     // Create a token data id to specify the token to be minted.
    //     //  https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/aptos-token/sources/token.move
    //     let token_data_id = token::create_tokendata(
    //         creator,//&resource_signer,
    //         module_data.collection_name,
    //         token_name,
    //         description,//string::utf8(b""), // description
    //         1,  // maximum supply
    //         token_uri, // uri
    //         receiver_addr,//resource_account_address,  // royalty receiver
    //         20, // royalty_points_denominator
    //         1, // royalty_points_numerator
    //         // This variable sets if we want to allow mutation for token maximum, uri, royalty, description, and properties.
    //         // Here we enable mutation for properties by setting the last boolean in the vector to true.
    //         token::create_token_mutability_config(
    //             &vector<bool>[false,true,false,false,true],// 1,uri,royalty,description, properies
    //         ),
    //         vector<String>[string::utf8(b"TOKEN_PROPERTY_MUTABLE"),
    //             string::utf8(b"uri_cap"),
    //             string::utf8(b"uri_decap"),
    //             string::utf8(b"capped"), 
    //             string::utf8(b"stat1"), 
    //             string::utf8(b"stat2"), 
    //             string::utf8(b"stat3"), 
    //             string::utf8(b"stat4"), 
    //             string::utf8(b"level")],
    //         vector<vector<u8>>[bcs::to_bytes<bool>(&token_property_mutable),
    //             bcs::to_bytes(&uri_cap),
    //             bcs::to_bytes(&uri_decap),
    //             bcs::to_bytes<bool>(&capped),
    //             bcs::to_bytes<u8>(&stat1),
    //             bcs::to_bytes<u8>(&stat2),
    //             bcs::to_bytes<u8>(&stat3),
    //             bcs::to_bytes<u8>(&stat4),
    //             bcs::to_bytes<u64>(&level)
    //         ],
    //         vector<String>[ string::utf8(b"bool") ,
    //             string::utf8(b"string"),
    //             string::utf8(b"string"),
    //             string::utf8(b"bool"),
    //             string::utf8(b"u8"),
    //             string::utf8(b"u8"),
    //             string::utf8(b"u8"),
    //             string::utf8(b"u8"),
    //             string::utf8(b"u64")
    //         ]
    //     );
    //     let token_id = token::mint_token(
    //         creator,//&resource_signer, 
    //         token_data_id, 1);
    //     // what is different with opt_in_direct_transfer? 
    //     //token::opt_in_direct_transfer(receiver,true);
    //     // mint price 
    //     //coin::transfer<AptosCoin>(receiver, resource_data.source, mint_price);
    //     token::direct_transfer(
    //         creator,//&resource_signer, 
    //         creator, token_id, 1);

    //     // what is different between mint_token_to() and mint_token , direct_transfer 
    //     // create tokens and directly deposite to receiver's address. 
    //     //The receiver should opt-in direct transfer
    //     //token::mint_token_to()

    //     event::emit_event<TokenMintingEvent>(
    //         &mut module_data.token_minting_events,
    //         TokenMintingEvent {
    //             token_receiver_address: receiver_addr,
    //             token_data_id: token_data_id,
    //         }
    //     );

    //     // TODO store token name in the modules vector
    //     module_data.minted=module_data.minted+1

    // }

    // sell the first token to a claimer
    // claimer should know the token name like 'Cannedbi NFT #1'
    // public entry fun claim_genesis_token(claimer: &signer,
    //     token_name : string::String) acquires ModuleData {

    //     //let receiver_addr = signer::address_of(claimer);

    //     let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
    //     let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    //     let resource_account_address = signer::address_of(&resource_signer);

    //     // let token_data_id = token::create_token_data_id(@cannedbi_nft,
    //     //     module_data.collection_name,token_name);
        
    //     let property_version = 0;
    //     let token_id = token::create_token_id_raw(@cannedbi_nft, 
    //         module_data.collection_name, token_name, property_version);
        
    //     // the claimer should opt-in direct transfer
    //     //token::opt_in_direct_transfer(claimer,true);

    //     // check the claimer has the token
    //     // take the mint price from the claimer
    //     coin::transfer<AptosCoin>(claimer, resource_account_address, module_data.mint_price);
        
    //     // give the token to the claimer
    //     token::direct_transfer(&resource_signer, claimer, token_id, 1);
        
    // }

    // TODO change cap to decap vice versa
    // TODO change stat1,stat2,stat3,stat4
    // TODO change badge1

    // #[test]
    // public entry fun test1() {
    //     debug::print_stack_trace();
    // }
    // #[test_only]
    // public fun set_up_test(
    //     origin_account: &signer,
    //     resource_account: &signer,
    //     aptos_framework: signer,
    //     nft_receiver1: &signer,
    //     nft_receiver2: &signer,
    //     timestamp: u64
    // ) {
    //     debug::print_stack_trace();

    //     //debug::print<String>(string::utf8(b"set_up_test"));
        

    //     // set up global time for testing purpose
    //     timestamp::set_time_has_started_for_testing(&aptos_framework);
    //     timestamp::update_global_time_for_test_secs(timestamp);

    //     create_account_for_test(signer::address_of(origin_account));

    //     // create a resource account from the origin account, mocking the module publishing process
    //     //resource_account::create_resource_account(&origin_account, vector::empty<u8>(), vector::empty<u8>());

    //     init_module(origin_account);

    //     create_account_for_test(signer::address_of(nft_receiver1));
    //     create_account_for_test(signer::address_of(nft_receiver2));

    //     create_account_for_test(@admin_addr);
    // }

    // #[test (origin_account = @0xc84a935f76c07f852d1378c6894b7b61ac8780671dc281af5f479b48b4a5afad,
    //     nft_receiver1 = @0x123, nft_receiver2 = @0x234)]
    // //#[test(aptos_framework = @aptos_framework)]
    // public entry fun test_happy_path(origin_account: signer, nft_receiver1: signer, nft_receiver2: signer) acquires ModuleData {
        
        
    //     //set_up_test(&origin_account, &resource_account, aptos_framework, &nft_receiver1, &nft_receiver2,10);
        
    //     debug::print_stack_trace();

    //     //debug::print<string>(string::utf8(b"test_happy_path"));
        
    //     let receiver_addr1 = signer::address_of(&nft_receiver1);
    //     debug::print<address>(&receiver_addr1);
    //     let receiver_addr2 = signer::address_of(&nft_receiver2);
    //     debug::print<address>(&receiver_addr2);
        
    //     // todo console log??
    //     create_token(&origin_account,
    //         string::utf8(b"nft#1"),
    //         string::utf8(b"desc#1"),
    //         string::utf8(b"uri"),
    //         string::utf8(b"uri cap"),
    //         string::utf8(b"uri decap"),
    //         1,2,3,4
    //     );

    //     create_token(&origin_account,
    //         string::utf8(b"nft#2"),
    //         string::utf8(b"desc#2"),
    //         string::utf8(b"uri"),
    //         string::utf8(b"uri cap"),
    //         string::utf8(b"uri decap"),
    //         2,2,3,4
    //     );

    //     create_token(&origin_account,
    //         string::utf8(b"nft#3"),
    //         string::utf8(b"desc#3"),
    //         string::utf8(b"uri"),
    //         string::utf8(b"uri cap"),
    //         string::utf8(b"uri decap"),
    //         3,2,3,4
    //     );

    //     // mint nft to this nft receiver1
    //     claim_genesis_token(&nft_receiver1, string::utf8(b"nft#1"));
        
    //     // check that the nft_receiver has the token in their token store
    //     let module_data = borrow_global_mut<ModuleData>(@cannedbi_nft);
    //     let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
    //     let resource_signer_addr = signer::address_of(&resource_signer);
    //     let token_id = token::create_token_id_raw(resource_signer_addr, 
    //         string::utf8(b"Cannedbi Aptos NFT Collection #1"), 
    //         string::utf8(b"nft#2"), 1);
    //     let new_token = token::withdraw_token(&nft_receiver1, token_id, 1);

    //     // put the token back since a token isn't droppable
    //     token::deposit_token(&nft_receiver1, new_token);

    //     // mint the second NFT
    //     claim_genesis_token(&nft_receiver2, string::utf8(b"nft#2"));

    //     //  check the property version is properly updated
    //     let token_id2 = token::create_token_id_raw(resource_signer_addr, 
    //         string::utf8(b"Cannedbi Aptos NFT Collection #1"), 
    //         string::utf8(b"nft#2"), 1);
    //     let new_token2 = token::withdraw_token(&nft_receiver2, token_id2, 1);
    //     token::deposit_token(&nft_receiver2, new_token2);
    // }



}