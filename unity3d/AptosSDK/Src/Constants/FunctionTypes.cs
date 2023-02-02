namespace Mirage.Aptos.SDK.Constants
{
	public static class FunctionTypes
	{
		public const string Transfer = "0x1::coin::transfer";
		public const string CreateCollectionScript = "0x3::token::create_collection_script";
		public const string CreateTokenScript = "0x3::token::create_token_script";
		public const string OfferScript = "0x3::token_transfers::offer_script";
		public const string ClaimScript = "0x3::token_transfers::claim_script"; 
		
		// cannedbi devnet  functions
		public const string MintBadgeScript = "0x7791c51653f89f9c07bb5823d0fbebd2633908738cba76d2c9f4ff3ad4d88f5e::badge::mint_script_v1";
		public const string BadgeTokenMachineAddr = "0x364c6239887d0bb6628c18c5823b1a84614987f57f8fc7b4358836e5f94e74af";
	}
}