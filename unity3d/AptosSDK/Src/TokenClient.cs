using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections;
using System.Collections.Generic;
using Mirage.Aptos.SDK.Constants;
using Mirage.Aptos.SDK.DTO;
using Mirage.Aptos.Constants;
using Mirage.Aptos.SDK.DTO.ResponsePayloads;
using Mirage.Aptos.SDK.Services;
using Newtonsoft.Json;

using UnityEngine;

namespace Mirage.Aptos.SDK
{
    public class TokenIds
    {
        public Data data;
        public string deposit_sequence_number;
        public int withdraw_sequence_number;
        public int difference;
    }

    public class TokenReturn
    {
        public IList<TokenIds> tokenIds;
        public int maxDepositSequenceNumber;
        private int maxWithDrawSequenceNumber;

        public TokenReturn(IList<TokenIds> _tokenIds, int _maxDepo, int _maxWith)
        {
            tokenIds = _tokenIds;
            maxDepositSequenceNumber = _maxDepo;
            maxWithDrawSequenceNumber = _maxWith;
        }
    }

    public class TokenTableItem
    {
        public string collection {get; set;}
        public int withdraw_sequence_number {get; set;}
    }

    public class TokenClient : SpecificClient
    {
        /// <summary>
        /// Creates new TokenClient instance.
        /// </summary>
        /// <param name="client"><see cref="Client"/> instance.</param>
        public TokenClient(Client client) : base(client, ABIs.GetTokenABIs())
        {
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /// <summary>
        /// Request to mint a badge 
        /// ${CANNEDBI_BADGE_ADDRESS}::badge::mint_script_v1
        /// </summary>
        /// <param name="account">Account where token from which tokens will be transfered.</param>
        /// <param name="tokenMachine">Hex-encoded 32 byte Aptos account address that mints badge tokens.</param>
        /// <param name="name">Token name. ex) Cannedbi Badge NFT #1 </param>
        /// <param name="extraArgs">Extra args for checking the balance.</param>
        /// <returns>The transaction submitted to the API.</returns>
        public Task<PendingTransactionPayload> ClaimMintBadgeToken(
            Account account,
            string name,
            string tokenMachine = FunctionTypes.BadgeTokenMachineAddr,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var payload = new EntryFunctionPayload
            {
                Type = TransactionPayloadTypes.EntryFunction,
                Function = FunctionTypes.MintBadgeScript,
                TypeArguments = Array.Empty<string>(),
                Arguments = new object[]
                    { tokenMachine, name }
            };

            return GenerateSignSubmitTransaction(account, payload, extraArgs);
        }
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        /// <summary>
        /// Creates a new NFT collection within the specified account.
        /// </summary>
        /// <param name="account">Account where collection will be created.</param>
        /// <param name="name">Collection name.</param>
        /// <param name="description">Collection description.</param>
        /// <param name="uri">URL to additional info about collection.</param>
        /// <param name="maxAmount">Maximum number of `token_data` allowed within this collection.</param>
        /// <param name="extraArgs">Extra args for checking the balance.</param>
        /// <returns>The transaction submitted to the API.</returns>
        public Task<PendingTransactionPayload> CreateCollection(
            Account account,
            string name,
            string description,
            string uri,
            long maxAmount = UInt32.MaxValue,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var payload = new EntryFunctionPayload
            {
                Type = TransactionPayloadTypes.EntryFunction,
                Function = FunctionTypes.CreateCollectionScript,
                TypeArguments = Array.Empty<string>(),
                Arguments = new object[]
                    { name, description, uri, maxAmount.ToString(), new bool[] { false, false, false } }
            };

            return GenerateSignSubmitTransaction(account, payload, extraArgs);
        }

        /// <summary>
        /// Creates a new NFT collection within the specified account.
        /// </summary>
        /// <param name="account">Account where token will be created.</param>
        /// <param name="collectionName">Name of collection, that token belongs to.</param>
        /// <param name="name">Token name.</param>
        /// <param name="description">Token description.</param>
        /// <param name="supply">Token supply.</param>
        /// <param name="uri">URL to additional info about token.</param>
        /// <param name="max">The maxium of tokens can be minted from this token.</param>
        /// <param name="royaltyPayeeAddress">The address to receive the royalty, the address can be a shared account address.</param>
        /// <param name="royaltyPointsDenominator">The denominator for calculating royalty.</param>
        /// <param name="royaltyPointsNumerator">The numerator for calculating royalty.</param>
        /// <param name="propertyKeys">The property keys for storing on-chain properties.</param>
        /// <param name="propertyValues">The property values to be stored on-chain.</param>
        /// <param name="propertyTypes">The type of property values.</param>
        /// <param name="extraArgs">Extra args for checking the balance.</param>
        /// <returns>The transaction submitted to the API.</returns>
        public Task<PendingTransactionPayload> CreateToken(
            Account account,
            string collectionName,
            string name,
            string description,
            ulong supply,
            string uri,
            ulong max = UInt64.MaxValue,
            string royaltyPayeeAddress = null,
            int royaltyPointsDenominator = 0,
            int royaltyPointsNumerator = 0,
            string[] propertyKeys = null,
            string[] propertyValues = null,
            string[] propertyTypes = null,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var payload = CreateTokenPayload(
                account,
                collectionName,
                name,
                description,
                supply,
                uri,
                max,
                royaltyPayeeAddress,
                royaltyPointsDenominator,
                royaltyPointsNumerator,
                propertyKeys,
                propertyValues,
                propertyTypes
            );

            return GenerateSignSubmitTransaction(account, payload, extraArgs);
        }

        /// <summary>
        /// Transfers specified amount of tokens from account to receiver.
        /// </summary>
        /// <param name="account">Account where token from which tokens will be transfered.</param>
        /// <param name="receiver">Hex-encoded 32 byte Aptos account address to which tokens will be transfered.</param>
        /// <param name="creator">Hex-encoded 32 byte Aptos account address to which created tokens.</param>
        /// <param name="collectionName">Name of collection where token is stored.</param>
        /// <param name="name">Token name.</param>
        /// <param name="amount">Amount of tokens which will be transfered.</param>
        /// <param name="propertyVersion">The version of token PropertyMap with a default value 0.</param>
        /// <param name="extraArgs">Extra args for checking the balance.</param>
        /// <returns>The transaction submitted to the API.</returns>
        public Task<PendingTransactionPayload> OfferToken(
            Account account,
            string receiver,
            string creator,
            string collectionName,
            string name,
            long amount,
            long propertyVersion = 0,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var payload = new EntryFunctionPayload
            {
                Type = TransactionPayloadTypes.EntryFunction,
                Function = FunctionTypes.OfferScript,
                TypeArguments = Array.Empty<string>(),
                Arguments = new object[]
                    { receiver, creator, collectionName, name, propertyVersion.ToString(), amount.ToString() }
            };

            return GenerateSignSubmitTransaction(account, payload, extraArgs);
        }

        /// <summary>
        /// Claims a token on specified account.
        /// </summary>
        /// <param name="account">Account which will claim token.</param>
        /// <param name="sender">Hex-encoded 32 byte Aptos account address which holds a token.</param>
        /// <param name="creator">Hex-encoded 32 byte Aptos account address which created a token.</param>
        /// <param name="collectionName">Name of collection where token is stored.</param>
        /// <param name="name">Token name.</param>
        /// <param name="propertyVersion">The version of token PropertyMap with a default value 0.</param>
        /// <param name="extraArgs">Extra args for checking the balance.</param>
        /// <returns>The transaction submitted to the API.</returns>
        public Task<PendingTransactionPayload> ClaimToken(
            Account account,
            string sender,
            string creator,
            string collectionName,
            string name,
            long propertyVersion = 0,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var payload = new EntryFunctionPayload
            {
                Type = TransactionPayloadTypes.EntryFunction,
                Function = FunctionTypes.ClaimScript,
                TypeArguments = Array.Empty<string>(),
                Arguments = new object[]
                    { sender, creator, collectionName, name, propertyVersion.ToString() }
            };

            return GenerateSignSubmitTransaction(account, payload, extraArgs);
        }

        public async Task<CollectionPayload> GetCollectionData(string creator, string collectionName)
        {
            var collections = await _client.GetAccountResource(creator, ResourcesTypes.Collections);
            var collectionData = collections.Data.ToObject<CollectionsResource>();
            var handle = collectionData.CollectionData.Handle;

            var request = new TableItemRequest
            {
                KeyType = KeyTypes.String,
                ValueType = ValueTypes.CollectionData,
                Key = collectionName
            };

            return await _client.GetTableItem<CollectionPayload>(handle, request);
        }

        public async Task<TokenPayload> GetTokenData(string creator, string collectionName, string tokenName)
        {
            var collections = await _client.GetAccountResource(creator, ResourcesTypes.Collections);
            var collectionData = collections.Data.ToObject<CollectionsResource>();
            var handle = collectionData.TokenData.Handle;

            var request = new TableItemRequest
            {
                KeyType = KeyTypes.TokenDataId,
                ValueType = ValueTypes.TokenData,
                Key = new TokenDataId
                {
                    Creator = creator,
                    Collection = collectionName,
                    Name = tokenName
                }
            };

            var tableItem = await _client.GetTableItem<TokenPayload>(handle, request);

            return tableItem;
        }

        public Task<TokenFromAccount> GetToken(
            string creator,
            string collectionName,
            string tokenName,
            long propertyVersion
        )
        {
            var tokenId = new TokenId
            {
                TokenDataId = new TokenDataId
                {
                    Creator = creator,
                    Collection = collectionName,
                    Name = tokenName
                },
                PropertyVersion = propertyVersion.ToString()
            };

            return GetTokenForAccount(creator, tokenId);
        }

        public async Task<TokenReturn> GetTokenIds(string address, ulong? limit = null, ulong? depositStart = null, ulong? withdrawStart = null)
        {
            var countDeposit = new Dictionary<string, TokenEvent>();
            var elementsFetched = new HashSet<string>();
            var tokenIds = new List<TokenIds>();

            TokenEvent[] depositEvents = await _client.GetTokenEventsByEventHandle(
              address,
              ResourcesTypes.TokenStore,
              "deposit_events",
              limit,
              depositStart
            );

            // VersionedEvent withdrawEvents = await _client.GetEventsByEventHandle(
            // address,
            // "0x3::token::TokenStore",
            // "withdraw_events",
            // limit,
            // withdrawStart
            // ).Result;
            TokenEvent[] withdrawEvents = await _client.GetTokenEventsByEventHandle(
            address,
               ResourcesTypes.TokenStore,
               "withdraw_events",
              limit,
               withdrawStart
              );

            // Debug.Log($"withdrawEvents.Count : {withdrawEvents.Length}");

            var maxDepositSequenceNumber = -1;
            var maxWithDrawSequenceNumber = -1;


            foreach (var element in depositEvents)
            {
                string elementString = (element.data.id.ToStringKey());
                // Debug.Log(elementString);
                elementsFetched.Add(elementString.ToString());

                if (countDeposit.ContainsKey(elementString))
                {
                    countDeposit[elementString].count++;
                    countDeposit[elementString].sequence_number = element.sequence_number;
                }
                else
                {
                    countDeposit[elementString] = new TokenEvent
                    {
                        count = 1,
                        sequence_number = element.sequence_number,
                        data = element.data
                    };
                }

                maxDepositSequenceNumber = Math.Max(maxDepositSequenceNumber, int.Parse(element.sequence_number));
            }

            foreach (var element in withdrawEvents)
            {
                string elementString = (element.data.id.ToStringKey());
                elementsFetched.Add(elementString.ToString());

                if (countDeposit.ContainsKey(elementString))
                {
                    countDeposit[elementString].count++;
                    countDeposit[elementString].sequence_number = element.sequence_number;
                }
                else
                {
                    countDeposit[elementString] = new TokenEvent
                    {
                        count = 1,
                        sequence_number = element.sequence_number,
                        data = element.data
                    };
                }

                maxWithDrawSequenceNumber = Math.Max(maxDepositSequenceNumber, int.Parse(element.sequence_number));
            }

            if (elementsFetched.Count > 0)
            {
                foreach (var elementString in elementsFetched)
                {
                    var depositEventCount = countDeposit.ContainsKey(elementString) ? countDeposit[elementString].count : 0;

                    tokenIds.Add(new TokenIds
                    {
                        data = countDeposit.ContainsKey(elementString) ? countDeposit[elementString].data : null,
                        deposit_sequence_number = countDeposit.ContainsKey(elementString) ? countDeposit[elementString].sequence_number : "-1",
                        withdraw_sequence_number = 0,
                        difference = depositEventCount - 0
                    });
                }
            }

            TokenReturn returnValue = new TokenReturn(tokenIds, maxDepositSequenceNumber, maxWithDrawSequenceNumber);

            return returnValue;
        }

        public async Task<List<TokenPayload>> GetTokens
        (
            string address, 
            ulong? limit = null, 
            ulong? depositStart = null, 
            ulong? withdrawStart = null)
        {
            var tokenIds = await GetTokenIds(address, limit, depositStart, withdrawStart);

            Debug.Log(JsonConvert.SerializeObject(tokenIds));

            var tokens = new List<TokenPayload>();

            foreach (TokenIds tokenId in tokenIds.tokenIds)
            {
                try
                {
                    // Debug.Log(tokenId.data.amount);
                    MoveResource[] resources = await _client.GetAccountResources(tokenId.data.id.token_data_id.creator);

                    var accountResource = resources.FirstOrDefault(r => r.Type == "0x3::token::Collections");
                    var tableItemRequest = new TableItemRequest
                    {
                        KeyType = KeyTypes.TokenDataId,
                        ValueType = ValueTypes.TokenData,
                        Key = new TokenDataId
                        {
                            Creator = tokenId.data.id.token_data_id.creator,
                            Collection = tokenId.data.id.token_data_id.collection,
                            Name = tokenId.data.id.token_data_id.name
                        }
                    };

                    // Debug.Log($"Handle : {accountResource.Data.ToObject<CollectionsResource>().TokenData.Handle}");

                    var token = await _client.GetTableItem<TokenPayload>(accountResource.Data.ToObject<CollectionsResource>().TokenData.Handle, tableItemRequest);
                    // token.collection = tokenId.data.id.token_data_id.collection;
                    // token.withdraw_sequence_number =tokenId.withdraw_sequence_number;
                    tokens.Add(token);
                }
                catch (Exception e)
                {
                    Debug.LogError(e.Message);
                    Debug.LogError(e.Data);
                    Debug.LogError(e.Source);
                }
            }

            return tokens;
        }

        public async Task<TokenFromAccount> GetTokenForAccount(string creator, TokenId tokenId)
        {
            TokenResource collectionData = null;
            try
            {
                var collections = await _client.GetAccountResource(creator, ResourcesTypes.TokenStore);
                collectionData = collections.Data.ToObject<TokenResource>();
            }
            catch (AptosException e)
            {
                if (e.ErrorCode == "resource_not_found")
                {
                    return CreateEmptyToken(tokenId);
                }
            }

            var handle = collectionData.Tokens.Handle;

            var request = new TableItemRequest
            {
                KeyType = KeyTypes.TokenId,
                ValueType = ValueTypes.Token,
                Key = tokenId
            };

            try
            {
                return await _client.GetTableItem<TokenFromAccount>(handle, request);
            }
            catch (AptosException e)
            {
                Console.WriteLine(e.ErrorCode);
                if (e.ErrorCode == "table_item_not_found")
                {
                    return CreateEmptyToken(tokenId);
                }

                throw;
            }
        }

        private TokenFromAccount CreateEmptyToken(TokenId tokenId)
        {
            return new TokenFromAccount
            {
                Id = tokenId,
                Amount = "0"
            };
        }

        private async Task<PendingTransactionPayload> GenerateSignSubmitTransaction(
            Account account,
            EntryFunctionPayload payload,
            OptionalTransactionArgs extraArgs = null
        )
        {
            var transaction = await PrepareTransaction(account, payload, extraArgs);

            var raw = transaction.GetRaw();
            var signature = _signatureBuilder.GetSignature(account, raw);
            var request = transaction.GetRequest(payload, signature);

            var receipt = await _client.SubmitTransaction(request);

            return receipt;
        }

        private EntryFunctionPayload CreateTokenPayload(
            Account account,
            string collectionName,
            string name,
            string description,
            ulong supply,
            string uri,
            ulong max = UInt64.MaxValue,
            string royaltyPayeeAddress = null,
            int royaltyPointsDenominator = 0,
            int royaltyPointsNumerator = 0,
            string[] propertyKeys = null,
            string[] propertyValues = null,
            string[] propertyTypes = null
        )
        {
            if (royaltyPayeeAddress == null)
            {
                royaltyPayeeAddress = account.Address;
            }

            if (propertyKeys == null)
            {
                propertyKeys = Array.Empty<string>();
            }

            if (propertyValues == null)
            {
                propertyValues = Array.Empty<string>();
            }

            if (propertyTypes == null)
            {
                propertyTypes = Array.Empty<string>();
            }

            return new EntryFunctionPayload
            {
                Type = TransactionPayloadTypes.EntryFunction,
                Function = FunctionTypes.CreateTokenScript,
                TypeArguments = Array.Empty<string>(),
                Arguments = new object[]
                {
                    collectionName,
                    name,
                    description,
                    supply.ToString(),
                    max.ToString(),
                    uri,
                    royaltyPayeeAddress,
                    royaltyPointsDenominator.ToString(),
                    royaltyPointsNumerator.ToString(),
                    new bool[] { false, false, false, false, false },
                    propertyKeys,
                    propertyValues,
                    propertyTypes
                }
            };
        }
    }
}