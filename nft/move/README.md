

# CANNEDBI 

## Compile &  Test &  Publish

* compile

```bash
aptos move compile  --named-addresses can_coin=default
```

* test

```bash
aptos move test --named-addresses can_coin=default
```

* publish
```bash
aptos  move publish  --named-addresses can_coin=default
```

## CanCoin

## Cannedbi NFT

## Cannedbi Badge Token


## Cannedbi Game Proof

## Cannedbi Shop

* 어드민에 의해서 파는 아이템들을 파는 숍

## Cannedbi Marketplace

* NFT, Badge 를 올려서 public 대상으로 사고 파는 경매장


## Cannedbi SNS private key store

* 생각만 하는 중...
* facebook auth token 으로 private key 의 절반을 저장해 둔다?


## resource  account

```bash
aptos account create-resource-account --seed 1234
Do you want to submit a transaction for a range of [149800 - 224700] Octas at a gas unit price of 100 Octas? [yes/no] >
yes
{
  "Result": {
    "resource_account": "19faef9a696da006e997a8f476ee0cb76beb4991085a7547f9902ec2cd6333b4",
    "transaction_hash": "0x4e4fbe8fcd70ab0196f7b6e4e416e0c08f4798fc7f6cb99c8b5e96829512e284",
    "gas_used": 1533,
    "gas_unit_price": 100,
    "sender": "0f51874fefd26cc8b40a6632057bf34bf2a22bbfe6cdf46838a31dcf598f1b34",
    "sequence_number": 23,
    "success": true,
    "timestamp_us": 1674974786549793,
    "version": 6358726,
    "vm_status": "Executed successfully"
  }
}
```

## tests

```bash
aptos move test --named-addresses cannedbi=default,source_addr=default
```


## compile move

```bash
aptos move compile --named-addresses deployer=default,cannedbi_nft=default
```

## deploy


```bash
export DEPLOYER_ADDRESS=af58703596ab584b8dc13f88fa09eca1b97eb11b74d042dcabd07fd0b269d6a2
export DEPLOYER_PRIVATE_KEY=28a44b352e5f6dbc93cfbaae325aa8a68e99b401f54fee19ea03fd6ba4ab7633
export APTOS_NODE_URL=http://127.0.0.1:8080
cargo run
```

```bash
export DEPLOYER_ADDRESS=af58703596ab584b8dc13f88fa09eca1b97eb11b74d042dcabd07fd0b269d6a2
export DEPLOYER_PRIVATE_KEY=28a44b352e5f6dbc93cfbaae325aa8a68e99b401f54fee19ea03fd6ba4ab7633
export APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
cargo run
```
