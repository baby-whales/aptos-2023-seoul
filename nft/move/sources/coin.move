// This module is used to initialize the CanCoin module. It is called by the
// APTOS framework when the CanCoin module is deployed. The CanCoin module
// is a managed coin module that is used to represent the CanCoin token.
// The CanCoin token is used to pay for the use of the CANNEDBI Aptos platform.
module can_coin::can_coin {
    struct CanCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<CanCoin>(
            sender,
            b"Can Coin",
            b"CAN",
            6,
            false,
        );
    }
}