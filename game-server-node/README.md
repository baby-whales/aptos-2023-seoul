# Game Server


## User Authenication
The purpose of this authentication apis is to confirm that the user is the actual owner of the address. 
### How does it work?
The client receives a Nonce message from the server, then compose SIWA(sign in with Aptos) message with  Address, public key, and nonce. 
The message will be signed with client's private key, then send back to server. Server will decrypt the message with client's public key to check the address is signed with actual client's private key.
Finally by comparing nonces, the server authorizes the client. 
Message Signing/decrypting can be done by using Ed22519.

```
{
    message:
     {
        address:"0xc020a394221",
        application : "cannedbi ",
        chainId: 1,
        fullMessage :"null",
        message : "",
        nonce : "h4ZwF19JEE5NlAGH"
    },
    pubkey : "0x44616ea8671b69.....",
    signature : "0x5f7982ff3f3f55d1179621b9bcfdd1e97757d5d103...."
}

```
```
      client                      server
        |   ------req nonce -------> |  gen nounce ,save it in connection session
        |   <------ nonce    ------- |
 gen message by si                   |
 addr, pubkey, nonce                 |
        |    ------signed msg -----> | decrpyt msg, check address, compare nonce
        |                            |
        |    <-- auth_ok/unauth ---- |
        |                            |


```
#### Example C# client

In the client_example directory, Simple test client is written in C#  (to help Unity developer).

## More Features(coming....)
