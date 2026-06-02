using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Ad;

namespace ForumApp.API.Infrastructure
{
    // Concrete ad source backed by the external DummyJSON products API.
    // ALL HTTP + provider-specific deserialization lives HERE, in the API layer, exactly
    // like LocalImageStorageService / SignalRHubNotifier. The business layer only ever
    // sees IAdProviderAction, never HttpClient or the DummyJSON shapes below.
    public class DummyJsonAdProvider : IAdProviderAction
    {
        private readonly HttpClient _http;

        public DummyJsonAdProvider(HttpClient http)
        {
            _http = http;
        }

        public async Task<IReadOnlyList<AdDto>> GetAdsAsync(CancellationToken ct = default)
        {
            var response = await _http.GetFromJsonAsync<DummyProductList>(
                "products?limit=50&select=title,description,price,thumbnail,brand,category", ct);

            return (response?.Products ?? new List<DummyProduct>())
                .Where(p => !string.IsNullOrWhiteSpace(p.Thumbnail))
                .Select(MapToAd)
                .ToList();
        }

        // Translate the provider's product into OUR ad contract (anti-corruption layer).
        private static AdDto MapToAd(DummyProduct p) => new()
        {
            Id = p.Id,
            Title = string.IsNullOrWhiteSpace(p.Title) ? "Sponsored" : p.Title!,
            Body = p.Description ?? string.Empty,
            ImageUrl = p.Thumbnail ?? string.Empty,
            Price = p.Price,
            BrandLabel = !string.IsNullOrWhiteSpace(p.Brand)
                ? p.Brand!
                : (string.IsNullOrWhiteSpace(p.Category) ? "Sponsored" : p.Category!),
            TargetUrl = $"https://dummyjson.com/products/{p.Id}"
        };

        // ----- Shapes used only to deserialize the DummyJSON response (provider detail). -----
        private sealed class DummyProductList
        {
            [JsonPropertyName("products")]
            public List<DummyProduct> Products { get; set; } = new();
        }

        private sealed class DummyProduct
        {
            [JsonPropertyName("id")] public int Id { get; set; }
            [JsonPropertyName("title")] public string? Title { get; set; }
            [JsonPropertyName("description")] public string? Description { get; set; }
            [JsonPropertyName("price")] public decimal Price { get; set; }
            [JsonPropertyName("thumbnail")] public string? Thumbnail { get; set; }
            [JsonPropertyName("brand")] public string? Brand { get; set; }
            [JsonPropertyName("category")] public string? Category { get; set; }
        }
    }
}
