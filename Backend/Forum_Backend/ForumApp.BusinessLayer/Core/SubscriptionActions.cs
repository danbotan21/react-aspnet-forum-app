using ForumApp.DataAccess;
using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Subscription;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    // Premium subscription logic. The "payment" is simulated in-house (no external
    // provider): we validate the card details for format only, then extend the user's
    // PremiumUntil by one month. Nothing about the card is ever stored.
    public class SubscriptionActions
    {
        protected readonly ForumDbContext _context;

        // Plan configuration for the (simulated) premium subscription.
        protected const decimal PremiumMonthlyPrice = 4.99m;
        protected const string PremiumCurrency = "USD";

        public SubscriptionActions(ForumDbContext context)
        {
            _context = context;
        }

        internal async Task<SubscriptionStatusDto> GetStatusExecution(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, ct);

            return BuildStatus(user?.PremiumUntil);
        }

        internal async Task<ActionResponse> PurchasePremiumExecution(int userId, PurchasePremiumDto payment, CancellationToken ct = default)
        {
            // 1) Simulated payment processing (our own "checkout" — no real gateway).
            var paymentError = ValidatePayment(payment);
            if (paymentError != null)
                return new ActionResponse { IsSuccess = false, Message = paymentError };

            // 2) Activate/extend premium: start from the later of "now" or current expiry,
            //    so buying again while still premium stacks an extra month instead of losing time.
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            var now = DateTime.UtcNow;
            var basis = user.PremiumUntil.HasValue && user.PremiumUntil.Value > now
                ? user.PremiumUntil.Value
                : now;
            user.PremiumUntil = basis.AddMonths(1);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch
            {
                return new ActionResponse { IsSuccess = false, Message = "Could not activate premium. Please try again." };
            }

            return new ActionResponse
            {
                IsSuccess = true,
                Message = $"Premium activated until {user.PremiumUntil:yyyy-MM-dd}."
            };
        }

        private static SubscriptionStatusDto BuildStatus(DateTime? premiumUntil)
        {
            var isPremium = premiumUntil.HasValue && premiumUntil.Value > DateTime.UtcNow;
            return new SubscriptionStatusDto
            {
                IsPremium = isPremium,
                PremiumUntil = isPremium ? premiumUntil : null,
                Plan = "Premium",
                Price = PremiumMonthlyPrice,
                Currency = PremiumCurrency
            };
        }

        // ---- Simulated card validation (stands in for a real payment gateway) ----
        // Returns an error message if the "charge" should be declined, or null on success.
        private static string? ValidatePayment(PurchasePremiumDto p)
        {
            if (p == null) return "Missing payment details.";

            var digits = new string((p.CardNumber ?? string.Empty).Where(char.IsDigit).ToArray());
            if (digits.Length < 13 || digits.Length > 19 || !PassesLuhn(digits))
                return "Payment declined: invalid card number.";

            if (string.IsNullOrWhiteSpace(p.NameOnCard) || p.NameOnCard.Trim().Length < 3)
                return "Payment declined: invalid name on card.";

            if (!IsExpiryValid(p.Expiry))
                return "Payment declined: card expired or invalid expiry date.";

            var cvc = new string((p.Cvc ?? string.Empty).Where(char.IsDigit).ToArray());
            if (cvc.Length < 3 || cvc.Length > 4)
                return "Payment declined: invalid CVC.";

            // Some well-known test numbers are "valid" (they pass Luhn) but are meant to
            // simulate a bank decline — this mirrors how real gateways like Stripe expose
            // dedicated decline test cards.
            var declineMessage = GetDeclineMessage(digits);
            if (declineMessage != null)
                return declineMessage;

            return null; // looks valid — the simulated charge succeeds
        }

        // Decline test cards (all pass Luhn). Used to demo the failure path.
        private static string? GetDeclineMessage(string digits) => digits switch
        {
            "4000000000000002" => "Payment declined: your card was declined by the issuer.",
            "4000000000009995" => "Payment declined: insufficient funds.",
            _ => null
        };

        // Luhn checksum — the same algorithm real cards use, so the standard test card
        // 4242 4242 4242 4242 passes while a random number is rejected.
        private static bool PassesLuhn(string digits)
        {
            int sum = 0;
            bool doubleDigit = false;
            for (int i = digits.Length - 1; i >= 0; i--)
            {
                int d = digits[i] - '0';
                if (doubleDigit)
                {
                    d *= 2;
                    if (d > 9) d -= 9;
                }
                sum += d;
                doubleDigit = !doubleDigit;
            }
            return sum % 10 == 0;
        }

        private static bool IsExpiryValid(string? expiry)
        {
            if (string.IsNullOrWhiteSpace(expiry)) return false;

            var parts = expiry.Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) return false;
            if (!int.TryParse(parts[0], out var month) || month < 1 || month > 12) return false;
            if (!int.TryParse(parts[1], out var year)) return false;
            if (year < 100) year += 2000;

            // The card is valid through the last instant of its expiry month.
            var endOfMonth = new DateTime(year, month, 1).AddMonths(1).AddTicks(-1);
            return endOfMonth >= DateTime.UtcNow;
        }
    }
}
