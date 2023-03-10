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
    //use aptos_framework::event::{EventHandle};
    

    //use aptos_token::token::{Self,TokenDataId,TokenId};
    use aptos_token::token::{Self,TokenDataId};
    
    //use aptos_framework::coin;
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::AptosCoin;

    //use aptos_framework::account::create_account_for_test;
    //use aptos_framework::timestamp;
    //use aptos_framework::resource_account;
    #[test_only]
    use std::vector;
    #[test_only]
    use aptos_std::debug;

    // This struct stores the token receiver's address and token_data_id in the event of token minting
    struct TokenMintingEvent has drop, store {
        token_receiver_address: address,
        token_data_id: TokenDataId,
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
        max_supply : u64,// total supply  < max_supply , max_supply is the limit of the collection
        total_supply: u64,// total_supply is used to compare with minted count
        minted: u64,
        token_mutate_setting:vector<bool>,
    }

    /// Invalid signer
    const INVALID_SIGNER: u64 = 0;
    /// Action not authorized because the signer is not the admin of this module
    const ENOT_AUTHORIZED: u64 = 1;
    ///  INVALID_MINT_PRICE
    const INVALID_MINT_PRICE: u64 = 2;
    /// The collection minting is disabled
    const EMINTING_DISABLED: u64 = 3;
    /// Royalty numerator and denominator are invalid
    const EINVALID_ROYALTY_NUMERATOR_DENOMINATOR: u64 = 4;
    /// The collection is sold out
    const ESOLD_OUT:u64 = 5;
    /// minting is paused
    const EPAUSED:u64 = 6;
    /// minting limit is exceeded
    const MINT_LIMIT_EXCEED: u64 = 9;

    public entry fun init_collection(
        account: &signer,
        royalty_payee_address:address,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        seeds: vector<u8>
    ) {
        init_cannedbi_collection(account,
            royalty_payee_address,
            collection_name,collection_description,collection_uri,
            seeds);
    }

    public fun init_cannedbi_collection(
        account: &signer,
        royalty_payee_address:address,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        seeds: vector<u8>
    ) {
        init_general_collection(account,
            royalty_payee_address,
            collection_name,collection_description,collection_uri,
            10000000000,
            2727,
            seeds);
    }

    public fun init_general_collection(
        account: &signer,
        royalty_payee_address:address,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        max_supply : u64,
        total_supply : u64,
        seeds: vector<u8>
    ){
        let (_resource, resource_cap) = account::create_resource_account(account, seeds);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_cap);
        //let now = aptos_framework::timestamp::now_seconds();
        move_to<ResourceInfo>(&resource_signer_from_cap, ResourceInfo{resource_cap: resource_cap, source: signer::address_of(account)});
        let collection_mutate_setting = vector<bool>[true, true, true];//collection description, uri, and maximum.
        let token_mutate_setting = vector<bool>[false,true,true,true,true];//maximum,uri,royalty,description, properies

        move_to<TokenMachine>(&resource_signer_from_cap, TokenMachine{
            collection_name,
            collection_description,
            collection_uri,
            royalty_payee_address,
            royalty_points_denominator:100,
            royalty_points_numerator:1,
            mint_price:0,// default mint price is 0
            paused:false,
            max_supply,//max_supply:10000000000,
            total_supply,//2727:total_supply,
            minted:0,
            token_mutate_setting,
        });
        token::create_collection(
            &resource_signer_from_cap, 
            collection_name, 
            collection_description, 
            collection_uri, 
            total_supply,//maximum 2727
            collection_mutate_setting
        );
    }

    public entry fun mint_script_v1(
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
        let token_data_id =  token::create_tokendata(
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

        // let token_data_id = token::create_token_data_id(token_machine,
        //     token_machine_data.collection_name,token_name);
        token::opt_in_direct_transfer(receiver,true);

        let mint_price = token_machine_data.mint_price;
        //assert!(mint_price >= 0, INVALID_MINT_PRICE);
        if ( mint_price > 0 ) {
            coin::transfer<AptosCoin>(receiver, resource_data.source, mint_price);
        };

        token::mint_token_to(
            &resource_signer_from_cap,
            receiver_addr,
            token_data_id,
            1
            );
        token_machine_data.minted=token_machine_data.minted+1
    }

    public entry fun pause_mint(
        account: &signer,
        token_machine: address,
    )  acquires ResourceInfo,TokenMachine{
        let account_addr = signer::address_of(account);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        assert!(resource_data.source == account_addr, INVALID_SIGNER);
        let token_machine_data = borrow_global_mut<TokenMachine>(token_machine);
        token_machine_data.paused = true;
    }

    public entry fun resume_mint(
        account: &signer,
        token_machine: address,
    ) acquires ResourceInfo,TokenMachine{
        let account_addr = signer::address_of(account);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        assert!(resource_data.source == account_addr, INVALID_SIGNER);
        let token_machine_data = borrow_global_mut<TokenMachine>(token_machine);
        token_machine_data.paused = false;
    }

    public entry fun update_token_machine(
        account: &signer,
        token_machine: address,
        royalty_points_denominator: u64,
        royalty_points_numerator: u64,
        mint_price: u64,
    ) acquires ResourceInfo,TokenMachine{
        let account_addr = signer::address_of(account);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        //let now = aptos_framework::timestamp::now_seconds();
        assert!(resource_data.source == account_addr, INVALID_SIGNER);
        let token_machine_data = borrow_global_mut<TokenMachine>(token_machine);
        assert!(royalty_points_denominator > 0, EINVALID_ROYALTY_NUMERATOR_DENOMINATOR);
        if (royalty_points_denominator>0){
            token_machine_data.royalty_points_denominator = royalty_points_denominator
        };
        if (royalty_points_numerator>0){
            token_machine_data.royalty_points_numerator = royalty_points_numerator
        };
        
        if (mint_price>0){
            token_machine_data.mint_price = mint_price
        };

    }

    public entry fun mutate_tokendata_property(
        account: &signer,
        token_machine: address,
        token_name: String,
        keys: vector<String>,
        values: vector<vector<u8>>,
        types: vector<String>,
    ) acquires ResourceInfo,TokenMachine
    {
        let account_addr = signer::address_of(account);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        assert!(resource_data.source == account_addr, INVALID_SIGNER);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_data.resource_cap);

        let token_machine_data = borrow_global<TokenMachine>(token_machine); 
        let token_data_id = token::create_token_data_id(token_machine,
            token_machine_data.collection_name,token_name);

        token::mutate_tokendata_property(&resource_signer_from_cap,token_data_id,keys,values,types);  
    }

    public entry fun mutate_tokendata_uri(
        account: &signer,
        token_machine: address,
        token_name: String,
        uri: String,
    ) acquires ResourceInfo,TokenMachine
    {
        let account_addr = signer::address_of(account);
        let resource_data = borrow_global<ResourceInfo>(token_machine);
        assert!(resource_data.source == account_addr, INVALID_SIGNER);
        let resource_signer_from_cap = account::create_signer_with_capability(&resource_data.resource_cap);

        let token_machine_data = borrow_global<TokenMachine>(token_machine); 
        let token_data_id = token::create_token_data_id(token_machine,
            token_machine_data.collection_name,token_name);

        token::mutate_tokendata_uri(&resource_signer_from_cap,token_data_id,uri);
    }

    // mutate owner's token's property
    // to use level up things
    // public entry fun mutate_one_token(
    //     account: &signer,
    //     token_machine: address,
    //     token_owner: address,
    //     token_id: TokenId,
    //     keys: vector<String>,
    //     values: vector<vector<u8>>,
    //     types: vector<String>,
    // )acquires ResourceInfo
    // {
    //     let account_addr = signer::address_of(account);
    //     let resource_data = borrow_global<ResourceInfo>(token_machine);
    //     assert!(resource_data.source == account_addr, INVALID_SIGNER);
    //     let resource_signer_from_cap = account::create_signer_with_capability(&resource_data.resource_cap);
    //     // account: &signer,
    //     // token_owner: address,
    //     // token_id: TokenId,
    //     // keys: vector<String>,
    //     // values: vector<vector<u8>>,
    //     // types: vector<String>,
    //     token::mutate_one_token(&resource_signer_from_cap,token_owner,token_id,keys,values,types);
    // }

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
        coin::deposit(signer::address_of(creator), coin::mint(10000, &mint_cap));
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

        mint_script_v1(
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

    #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    public entry fun test_token_machine3(
            creator: &signer,
            aptos_framework: &signer,
            minter: &signer,
            token_machine: &signer
        ) acquires ResourceInfo,TokenMachine
    {
        set_up_test(creator,aptos_framework,minter,token_machine,80);
        aptos_framework::timestamp::update_global_time_for_test_secs(102);
        
        let token_machine_addr = account::create_resource_address(&signer::address_of(creator), b"cannedbi");

        let uri = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0003.png");
        let uri_cap = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0003.png");
        let uri_decap = string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0003.png");
        let stat1 = 1;
        let stat2 = 2;
        let stat3 = 3;
        let stat4 = 4;

        mint_script_v1(
            minter,
            token_machine_addr,
            string::utf8(b"Cannedbi NFT #3"),//token_name : string::String,
            string::utf8(b"Awesome Cannedbi NFT #3"),//description : string::String,
            uri,//token_uri : string::String,
            uri_cap,//uri_cap : string::String,
            uri_decap,//uri_decap : string::String,
            stat1,stat2,stat3,stat4
        );

        // account: &signer,
        // token_machine: address,
        // royalty_points_denominator: u64,
        // royalty_points_numerator: u64,
        // mint_price: u64
        update_token_machine(creator,token_machine_addr,100,2,200);
    }

    #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    public entry fun test_token_machine4(
            creator: &signer,
            aptos_framework: &signer,
            minter: &signer,
            token_machine: &signer
        ) acquires ResourceInfo,TokenMachine
    {
        set_up_test(creator,aptos_framework,minter,token_machine,80);
        aptos_framework::timestamp::update_global_time_for_test_secs(102);

        let token_machine_addr = account::create_resource_address(&signer::address_of(creator), b"cannedbi");

        let uri = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0004.png");
        let uri_cap = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0004.png");
        let uri_decap = string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0004.png");
        let stat1 = 1;
        let stat2 = 2;
        let stat3 = 3;
        let stat4 = 4;

        mint_script_v1(
            minter,
            token_machine_addr,
            string::utf8(b"Cannedbi NFT #4"),//token_name : string::String,
            string::utf8(b"Awesome Cannedbi NFT #4"),//description : string::String,
            uri,//token_uri : string::String,
            uri_cap,//uri_cap : string::String,
            uri_decap,//uri_decap : string::String,
            stat1,stat2,stat3,stat4
        );


        // account: &signer,
        // token_machine: address,
        // token_name: String,
        // keys: vector<String>,
        // values: vector<vector<u8>>,
        // types: vector<String>,
        mutate_tokendata_property(creator,
            token_machine_addr,
            string::utf8(b"Cannedbi NFT #4"),
            vector::empty(),
            vector::empty(),
            vector::empty()
        );
    }

    #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    public entry fun test_token_machine5(
            creator: &signer,
            aptos_framework: &signer,
            minter: &signer,
            token_machine: &signer
        ) acquires ResourceInfo,TokenMachine
    {
        set_up_test(creator,aptos_framework,minter,token_machine,80);
        aptos_framework::timestamp::update_global_time_for_test_secs(102);

        let token_machine_addr = account::create_resource_address(&signer::address_of(creator), b"cannedbi");

        let uri = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0005.png");
        let uri_cap = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0005.png");
        let uri_decap = string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0005.png");
        let stat1 = 1;
        let stat2 = 2;
        let stat3 = 3;
        let stat4 = 4;

        mint_script_v1(
            minter,
            token_machine_addr,
            string::utf8(b"Cannedbi NFT #5"),//token_name : string::String,
            string::utf8(b"Awesome Cannedbi NFT #5"),//description : string::String,
            uri,//token_uri : string::String,
            uri_cap,//uri_cap : string::String,
            uri_decap,//uri_decap : string::String,
            stat1,stat2,stat3,stat4
        );


        // account: &signer,
        // token_machine: address,
        // token_name: String,
        // uri: String,
        mutate_tokendata_uri(creator,
            token_machine_addr,
            string::utf8(b"Cannedbi NFT #5"),
            string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0005.png")
        );
    }    


    // #[test(creator = @0xb0c, minter = @0xc0c, token_machine=@0x1,aptos_framework = @aptos_framework)]
    // public entry fun test_token_machine6(
    //         creator: &signer,
    //         aptos_framework: &signer,
    //         minter: &signer,
    //         token_machine: &signer
    //     ) acquires ResourceInfo,TokenMachine
    // {
    //     set_up_test(creator,aptos_framework,minter,token_machine,80);
    //     aptos_framework::timestamp::update_global_time_for_test_secs(102);

    //     let token_machine_addr = account::create_resource_address(&signer::address_of(creator), b"cannedbi");

    //     let uri = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0006.png");
    //     let uri_cap = string::utf8(b"ipfs://bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4/0006.png");
    //     let uri_decap = string::utf8(b"ipfs://bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe/0006.png");
    //     let stat1 = 1;
    //     let stat2 = 2;
    //     let stat3 = 3;
    //     let stat4 = 4;

    //     let token_name = string::utf8(b"Cannedbi NFT #6");
    //     mint_script_v1(
    //         minter,
    //         token_machine_addr,
    //         token_name,//string::utf8(b"Cannedbi NFT #6"),
    //         string::utf8(b"Awesome Cannedbi NFT #6"),//description : string::String,
    //         uri,//token_uri : string::String,
    //         uri_cap,//uri_cap : string::String,
    //         uri_decap,//uri_decap : string::String,
    //         stat1,stat2,stat3,stat4
    //     );

    //     //let token_machine_data = borrow_global<TokenMachine>(token_machine); 
    //     let collection_name = string::utf8(b"Cannedbi Aptos NFT Collection #1");
    //     let token_property_version = 0;// how to get latest version?
    //     let token_id = token::create_token_id_raw(token_machine_addr, 
    //         collection_name, token_name, token_property_version);
        
    //     // account: &signer,
    //     // token_machine: address,
    //     // token_owner: address,
    //     // token_id: TokenId,
    //     // keys: vector<String>,
    //     // values: vector<vector<u8>>,
    //     // types: vector<String>,
    //     mutate_one_token(creator,
    //         token_machine_addr,
    //         signer::address_of(minter),
    //         token_id,
    //         vector::empty(),
    //         vector::empty(),
    //         vector::empty()
    //     );
    // }  
}