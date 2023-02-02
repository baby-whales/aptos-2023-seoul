using System;
using System.Net;
using System.Threading.Tasks;
using Mirage.Aptos.SDK;
using Mirage.Aptos.SDK.DTO;
using Newtonsoft.Json;
using NUnit.Framework;
using System.Text;
using System.Security.Cryptography;
using Chaos.NaCl;

namespace Signin
{
    public class SIWADemo
    {
        private static string _privateKey;
        private static string _publicKey;
        private static UnicodeEncoding _encoder = new UnicodeEncoding();
        
        static void Main(string[] args)
        {
            AuthDelegator s;
            
            if (args.Length == 0)
            { 
                //for default testing
                var privKey = "......";
                s = new AuthDelegator(privKey);
            }
            else
            {
                s = new AuthDelegator(args[0]);
            }
            s.ShowAccount();
            var nonce = s.fetchNounce().GetAwaiter().GetResult();
            
            Console.WriteLine(nonce);
            var payload = s.AuthPayload(nonce, "cannedbi", 1);
            Console.WriteLine(payload);
            s.VerifyAccount(payload);
            s.CheckValidAccount().GetAwaiter().GetResult();
        }
    }

    public class AuthDelegator
    {
        string httpUrl = "http://34.64.228.175:3000";
        private Account account;
        // private string _collectionName = "Mirage Aptos SDK";
        // private string _tokenName = "Mirages's first token";
        // private long _tokenPropertyVersion = 0;
        // public string nonce = "abcd";
        static HttpClient httpClient = new HttpClient();

        public AuthDelegator(string privateKey)
        {
            this.account = new Account(StringToByteArray(privateKey.Replace("0x","")));
        }

        public AuthDelegator(Account account)
        {
            this.account = account;
        }

        public AuthDelegator()
        {
            var a = new Account();
            this.account = a;

        }
        
        
        

        public static string ByteArrayToString(byte[] ba)
        {
            StringBuilder hex = new StringBuilder(ba.Length * 2);
            foreach (byte b in ba)
                hex.AppendFormat("{0:x2}", b);
            return hex.ToString();
        }

        public static byte[] StringToByteArray(string hex)
        {
            return Enumerable.Range(0, hex.Length)
                .Where(x => x % 2 == 0)
                .Select(x => Convert.ToByte(hex.Substring(x, 2), 16))
                .ToArray();
        }
        

        public bool VerifyAccount(string json)
        {
            using (var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"))
            {
                HttpResponseMessage result = httpClient.PostAsync(httpUrl + "/verify", content).Result;
                if (result.StatusCode == System.Net.HttpStatusCode.Created)
                    return true;
                string returnValue = result.Content.ReadAsStringAsync().Result;
                return true;

            }
        }
        public async Task<string> CheckValidAccount()
        {
            try
            {
                using (var response = await httpClient.GetAsync(httpUrl + "/personal_information"))
                {
                    Console.WriteLine(response.StatusCode);
                    if (HttpStatusCode.OK == response.StatusCode)
                    {
                        string body = await response.Content.ReadAsStringAsync();
                        Console.WriteLine(body);
                        return body;
                    }
                    else
                    {
                        Console.WriteLine($" -- response.ReasonPhrase ==> {response.ReasonPhrase}");
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"ex.Message={ex.Message}");
                Console.WriteLine($"ex.InnerException.Message = {ex.InnerException.Message}");
            }
            catch (Exception ex2)
            {
                Console.WriteLine($"Exception={ex2.Message}");
            }

            return "Not Authenticated, Please Login";
        }
        public async Task<String> fetchNounce()
        {
            string result = "";
            try
            {
                using (var response = await httpClient.GetAsync(httpUrl + "/nonce"))
                {
                    Console.WriteLine(response.StatusCode);
                    if (HttpStatusCode.OK == response.StatusCode)
                    {
                        string body = await response.Content.ReadAsStringAsync();
                        Console.WriteLine(body);
                        result = body;
                    }
                    else
                    {
                        Console.WriteLine($" -- response.ReasonPhrase ==> {response.ReasonPhrase}");
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"ex.Message={ex.Message}");
                Console.WriteLine($"ex.InnerException.Message = {ex.InnerException.Message}");
            }
            catch (Exception ex2)
            {
                Console.WriteLine($"Exception={ex2.Message}");
            }
            return result;

        }

        public string AuthPayload(string nonce, string application, int chainId)
        {
            SIWAMsg msg = new SIWAMsg();
            msg.Address = account.Address;
            msg.Nonce = nonce;
            msg.Application = "cannedbi";
            msg.ChainId = chainId;
            byte[] bytes = Encoding.ASCII.GetBytes(JsonConvert.SerializeObject(msg));
            PostPayload pl = new PostPayload();
            pl.Message = JsonConvert.SerializeObject(msg);
            pl.Pubkey = account.PublicKey;
            pl.Signature = "0x" + ByteArrayToString(account.Sign(bytes));

            return JsonConvert.SerializeObject(pl);
        }

        public void ShowAccount()
        {
            Console.WriteLine("account public key : " +account.PublicKey);
            Console.WriteLine("account address    : " +account.Address );
        }
    }
    
    public class SIWAMsg
    {
        [JsonProperty(PropertyName = "address")]
        public string Address;

        [JsonProperty(PropertyName = "application")]
        public string Application;

        [JsonProperty(PropertyName = "chainId")]
        public long ChainId;

        [JsonProperty(PropertyName = "fullMessage")]
        public string FullMessage;

        [JsonProperty(PropertyName = "message")]
        public string Message;

        [JsonProperty(PropertyName = "nonce")] 
        public string Nonce;

    }

    public class PostPayload
    {
        [JsonProperty(PropertyName = "message")]
        public string Message;

        [JsonProperty(PropertyName = "pubkey")]
        public string Pubkey;

        [JsonProperty(PropertyName = "signature")]
        public string Signature;
    }
}