using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Subscription;

namespace ForumApp.BusinessLayer.Structure
{
    public class SubscriptionActionExecution : SubscriptionActions, ISubscriptionAction
    {
        public SubscriptionActionExecution(ForumDbContext context)
            : base(context) { }

        public Task<SubscriptionStatusDto> GetStatusAsync(int userId, CancellationToken ct = default)
            => GetStatusExecution(userId, ct);

        public Task<ActionResponse> PurchasePremiumAsync(int userId, PurchasePremiumDto payment, CancellationToken ct = default)
            => PurchasePremiumExecution(userId, payment, ct);
    }
}
