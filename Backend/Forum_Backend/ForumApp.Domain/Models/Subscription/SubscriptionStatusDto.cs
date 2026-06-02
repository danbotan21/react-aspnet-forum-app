namespace ForumApp.Domain.Models.Subscription
{
    // Current subscription state for the logged-in user, plus the plan being offered.
    public class SubscriptionStatusDto
    {
        public bool IsPremium { get; set; }
        public DateTime? PremiumUntil { get; set; }
        public string Plan { get; set; } = "Premium";
        public decimal Price { get; set; }
        public string Currency { get; set; } = "USD";
    }
}
