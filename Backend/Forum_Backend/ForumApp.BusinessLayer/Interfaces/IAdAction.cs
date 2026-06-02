using ForumApp.Domain.Models.Ad;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IAdAction
    {
        // Returns a small randomized set of sponsored ads for the feed sidebar.
        Task<IReadOnlyList<AdDto>> GetAdsForFeedAsync(int count = 3, CancellationToken ct = default);
    }
}
