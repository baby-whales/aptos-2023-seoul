
# upload files to ipfs

* https://nft.storage/docs/how-to/store-directory/#creating-a-project


* cap files

```bash
node storeDirectory.mjs /Users/wdshin/work-aptos/cannedbi-images/cap
storing file(s) from [object Object]
{ cid: 'bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4' }
{
  cid: 'bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4',
  deals: [],
  size: 356543880,
  pin: {
    cid: 'bafybeihq6s5paetbdh33hdxypua7tvchklfoymkaw7vpz4gzsc63fcupn4',
    created: 2023-01-21T14:31:39.484Z,
    size: 356543880,
    status: 'pinning'
  },
  created: 2023-01-21T14:31:39.484Z
}
```

* decap files

```bash
node storeDirectory.mjs /Users/wdshin/work-aptos/cannedbi-images/decap
storing file(s) from [object Object]
{ cid: 'bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe' }
{
  cid: 'bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe',
  deals: [],
  size: 162679401,
  pin: {
    cid: 'bafybeibcbiix4xlnydklnfg3ympksr6cio4d2muwmulznvd5ep7k7fbzqe',
    created: 2023-01-21T14:39:31.703Z,
    size: 162679401,
    status: 'pinned'
  },
  created: 2023-01-21T14:39:31.703Z
}
```
