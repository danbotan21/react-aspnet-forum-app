using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Subscription;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionAction _subscriptionService;

        public SubscriptionController(ISubscriptionAction subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        /// <summary>
        /// Returns the current user's subscription status and the offered plan.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyStatus(CancellationToken ct)
        {
            var status = await _subscriptionService.GetStatusAsync(GetCurrentUserId(), ct);
            return Ok(status);
        }

        /// <summary>
        /// Simulated checkout: validates the (fake) card details and activates premium
        /// for one month. No real payment is processed and no card data is stored.
        /// </summary>
        [HttpPost("purchase")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Purchase([FromBody] PurchasePremiumDto payment, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _subscriptionService.PurchasePremiumAsync(GetCurrentUserId(), payment, ct);
            if (!result.IsSuccess)
                return BadRequest(new { message = result.Message });

            return Ok(result);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
