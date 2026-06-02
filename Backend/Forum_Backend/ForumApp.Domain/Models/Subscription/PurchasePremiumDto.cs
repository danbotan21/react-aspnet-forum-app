using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Subscription
{
    // Simulated checkout payload. These card details are validated for FORMAT only
    // (Luhn + expiry + CVC) and never stored — there is no real payment provider.
    public class PurchasePremiumDto
    {
        [Required]
        public string CardNumber { get; set; } = string.Empty;

        [Required]
        public string NameOnCard { get; set; } = string.Empty;

        [Required]
        public string Expiry { get; set; } = string.Empty; // MM/YY

        [Required]
        public string Cvc { get; set; } = string.Empty;
    }
}
