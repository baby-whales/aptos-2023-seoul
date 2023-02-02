using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;

namespace GraphQL.Client.Example;

public static class Program
{
    public static async Task Main()
    {
        using var graphQLClient = new GraphQLHttpClient("https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql/", new NewtonsoftJsonSerializer());

        var graphQLRequest = new GraphQLRequest
        {
            Query = @"
            query MyQuery {
                tokens {
                    name
                }
            }
            ",
            OperationName = "tokens"
        };

        JsonSerializerOptions jso = new JsonSerializerOptions();
        jso.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        jso.WriteIndented = true;

        Console.WriteLine("raw request:");
        Console.WriteLine(System.Text.RegularExpressions.Regex.Unescape((JsonSerializer.Serialize(graphQLRequest, jso))).Replace(@"\", ""));
        var graphQLRequest_01 = JsonSerializer.Serialize(graphQLRequest, jso).Replace("\"", "");
        var graphQLResponse = await graphQLClient.SendQueryAsync<GraphQLTokenResponse>(graphQLRequest);
        Console.WriteLine("raw response:");
        Console.WriteLine(JsonSerializer.Serialize(graphQLResponse, jso));
        Console.WriteLine();
        // Console.WriteLine(graphQLResponse);
        // var films = string.Join(", ", graphQLResponse.Data.Person.FilmConnection.Films.Select(f => f.Title));
        // Console.WriteLine($"Films: {films}");
        // Console.WriteLine();
        // Console.WriteLine("Press any key to quit...");
        // Console.ReadKey();
    }
}