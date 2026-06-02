using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Subscription;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface ISubscriptionAction
    {
        Task<SubscriptionStatusDto> GetStatusAsync(int userId, CancellationToken ct = default);
        Task<ActionResponse> PurchasePremiumAsync(int userId, PurchasePremiumDto payment, CancellationToken ct = default);
    }
}
