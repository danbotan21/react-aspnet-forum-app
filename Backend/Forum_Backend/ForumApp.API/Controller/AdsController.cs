using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdsController : ControllerBase
    {
        private readonly IAdAction _adService;

        public AdsController(IAdAction adService)
        {
            _adService = adService;
        }

        /// <summary>
        /// Returns a small randomized set of sponsored ad cards for the feed sidebar.
        /// Inventory is sourced from an external products API and cached server-side.
        /// </summary>
        /// <param name="count">How many ad cards to return (default 3).</param>
        [HttpGet("feed")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFeedAds([FromQuery] int count = 3, CancellationToken ct = default)
        {
            var ads = await _adService.GetAdsForFeedAsync(count, ct);
            return Ok(ads);
        }
    }
}
