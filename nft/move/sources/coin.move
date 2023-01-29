module CanCoin::can_coin {
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