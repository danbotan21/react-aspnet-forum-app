using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FollowController : ControllerBase
    {
        private readonly IFollowAction _followService;

        public FollowController(IFollowAction followService)
        {
            _followService = followService;
        }

        // Follow a user
        [HttpPost("{userId:int}")]
        public async Task<IActionResult> Follow(int userId, CancellationToken ct)
        {
            var result = await _followService.FollowAsync(GetCurrentUserId(), userId, ct);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(result);
        }

        // Unfollow a user
        [HttpDelete("{userId:int}")]
        public async Task<IActionResult> Unfollow(int userId, CancellationToken ct)
        {
            var result = await _followService.UnfollowAsync(GetCurrentUserId(), userId, ct);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(result);
        }

        // Follow status + counts for a profile
        [HttpGet("status/{userId:int}")]
        public async Task<IActionResult> Status(int userId, CancellationToken ct)
            => Ok(await _followService.GetStatusAsync(GetCurrentUserId(), userId, ct));

        // Who follows this user
        [HttpGet("{userId:int}/followers")]
        public async Task<IActionResult> Followers(int userId, CancellationToken ct)
            => Ok(await _followService.GetFollowersAsync(userId, GetCurrentUserId(), ct));

        // Who this user follows
        [HttpGet("{userId:int}/following")]
        public async Task<IActionResult> Following(int userId, CancellationToken ct)
            => Ok(await _followService.GetFollowingAsync(userId, GetCurrentUserId(), ct));

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
