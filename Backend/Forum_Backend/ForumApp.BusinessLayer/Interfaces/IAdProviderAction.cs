using ForumApp.Domain.Models.Ad;

namespace ForumApp.BusinessLayer.Interfaces
{
    // Abstraction over an external ad source. The concrete implementation performs the
    // actual HTTP call and lives in the API/Infrastructure layer — the business layer
    // depends only on this contract, never on HttpClient (same pattern as
    // IImageStorageAction / IHubNotifierAction).
    public interface IAdProviderAction
    {
        // Returns the full clean ad inventory from the external provider.
        Task<IReadOnlyList<AdDto>> GetAdsAsync(CancellationToken ct = default);
    }
}
