using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Mirage.Aptos.SDK.DTO
{
    public class TokenEvent
    {
        public int count { get; set; }
        public string version { get; set; }
        public Guid guid { get; set; }
        public string sequence_number { get; set; }
        public string type { get; set; }
        public Data data { get; set; }
    }

    public class Guid
    {
        public string creation_number { get; set; }
        public string account_address { get; set; }
    }
    public class Data
    {
        public string amount { get; set; }
        public Id id { get; set; }
    }
    public class Id
    {
        public string property_version { get; set; }
        public CustomTokenDataId token_data_id { get; set; }

        public string ToStringKey()
        {
            return token_data_id.collection + "." + token_data_id.creator + "." + token_data_id.name;
        }
    }
    public class CustomTokenDataId
    {
        public string collection { get; set; }
        public string creator { get; set; }
        public string name { get; set; }
    }
}
