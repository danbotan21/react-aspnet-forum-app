using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Ad;

namespace ForumApp.BusinessLayer.Structure
{
    public class AdActionExecution : AdActions, IAdAction
    {
        public AdActionExecution(IAdProviderAction provider)
            : base(provider) { }

        public Task<IReadOnlyList<AdDto>> GetAdsForFeedAsync(int count = 3, CancellationToken ct = default)
            => GetAdsForFeedExecution(count, ct);
    }
}
