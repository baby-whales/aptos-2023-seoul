public class GraphQLTokenResponse {
    public tokens tokens { get; set; }
}

public class tokens {
    public string name { get; set; }
}

// public class GraphQLTokenResponse {
//     public current_token_ownerships current_token_ownerships { get; set; }
// }

// public class current_token_ownerships {
//     public uint amount { get; set; }
//     public string creator_address { get; set; }
//     public string collection_name { get; set; }
//     public string collection_data_id_hash { get; set; }
//     public string token_properties { get; set; }
//     public string token_data_id_hash { get; set; }
//     public string table_type { get; set; }
//     public uint property_version { get; set; }
//     public string owner_address { get; set; }
//     public string name { get; set; }
//     public string last_transaction_timestamp { get; set; }
//     public uint last_transaction_version { get; set; }
// }