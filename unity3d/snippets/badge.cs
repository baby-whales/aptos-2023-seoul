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