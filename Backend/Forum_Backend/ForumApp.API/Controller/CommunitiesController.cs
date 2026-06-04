using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Community;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommunitiesController : ControllerBase
    {
        private readonly ICommunityAction _communityService;
        private readonly IPostAction _postService;

        public CommunitiesController(ICommunityAction communityService, IPostAction postService)
        {
            _communityService = communityService;
            _postService = postService;
        }

        // GET api/communities
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var communities = await _communityService.GetAllCommunitiesAsync(TryGetCurrentUserId(), ct);
            return Ok(communities);
        }

        // GET api/communities/type/{type}
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetByType(string type, CancellationToken ct)
        {
            var communities = await _communityService.GetAllCommunitiesByTypeAsync(type, TryGetCurrentUserId(), ct);
            return Ok(communities);
        }

        // GET api/communities/user/{userId}
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
        {
            var communities = await _communityService.GetCommunitiesByUserAsync(userId, ct);
            return Ok(communities);
        }

        // GET api/communities/my — authenticated, returns communities with the caller's role
        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyCommunities(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var communities = await _communityService.GetUserCommunitiesWithRolesAsync(userId, ct);
            return Ok(communities);
        }

        // GET api/communities/{id}/mybannedstatus — returns ban status for the authenticated user
        [Authorize]
        [HttpGet("{id:int}/mybannedstatus")]
        public async Task<IActionResult> MyBannedStatus(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var (isBanned, banReason) = await _communityService.GetUserBanStatusAsync(id, userId, ct);
            return Ok(new { isBanned, banReason });
        }

        // GET api/communities/search?term=programming
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string term, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(term))
                return BadRequest("Search term cannot be empty.");

            var communities = await _communityService.SearchCommunitiesAsync(term, TryGetCurrentUserId(), ct);
            return Ok(communities);
        }

        // GET api/communities/{slug}
        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
        {
            // Pass userId if authenticated so private communities can verify membership
            int? requestingUserId = TryGetCurrentUserId();
            var community = await _communityService.GetCommunityAsync(slug, requestingUserId, ct);

            if (community == null)
                return NotFound($"Community '{slug}' was not found.");

            return Ok(community);
        }

        // GET api/communities/{communityId}/ismember?userId=1 — public, read-only
        [HttpGet("{communityId:int}/ismember")]
        public async Task<IActionResult> IsMember(int communityId, [FromQuery] int userId, CancellationToken ct)
        {
            var result = await _communityService.IsMemberAsync(communityId, userId, ct);
            return Ok(result);
        }

        // GET api/communities/{communityId}/isowner?userId=1 — public, read-only
        [HttpGet("{communityId:int}/isowner")]
        public async Task<IActionResult> IsOwner(int communityId, [FromQuery] int userId, CancellationToken ct)
        {
            var result = await _communityService.IsOwnerAsync(communityId, userId, ct);
            return Ok(result);
        }

        // POST api/communities
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommunityCreateDto communityData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var authorId = GetCurrentUserId();
            var result = await _communityService.CreateCommunityAsync(communityData, authorId, ct);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Error });

            return CreatedAtAction(nameof(GetBySlug), new { slug = result.Data!.Slug }, result.Data);
        }

        // PUT api/communities/{id}
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommunityUpdateDto communityData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.UpdateCommunityAsync(id, communityData, requestingUserId, ct);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Error });

            return Ok(result.Data);
        }

        // DELETE api/communities/{id}
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.DeleteCommunityAsync(id, requestingUserId, ct: ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        // POST api/communities/{id}/join
        [Authorize]
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _communityService.JoinCommunityAsync(id, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        // DELETE api/communities/{id}/leave
        [Authorize]
        [HttpDelete("{id:int}/leave")]
        public async Task<IActionResult> Leave(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _communityService.LeaveCommunityAsync(id, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        // GET api/communities/{id}/myrole — returns current user's role or null
        [Authorize]
        [HttpGet("{id:int}/myrole")]
        public async Task<IActionResult> MyRole(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var role = await _communityService.GetUserRoleAsync(id, userId, ct);
            return Ok(new { role });
        }

        // GET api/communities/{id}/members
        [Authorize]
        [HttpGet("{id:int}/members")]
        public async Task<IActionResult> GetMembers(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var role = await _communityService.GetUserRoleAsync(id, userId, ct);
            if (role != "owner" && role != "moderator") return Forbid();

            var members = await _communityService.GetMembersAsync(id, ct);
            return Ok(members);
        }

        // GET api/communities/{id}/banned
        [Authorize]
        [HttpGet("{id:int}/banned")]
        public async Task<IActionResult> GetBanned(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var role = await _communityService.GetUserRoleAsync(id, userId, ct);
            if (role != "owner" && role != "moderator") return Forbid();

            var banned = await _communityService.GetBannedMembersAsync(id, ct);
            return Ok(banned);
        }

        // GET api/communities/{id}/stats
        [Authorize]
        [HttpGet("{id:int}/stats")]
        public async Task<IActionResult> GetStats(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var role = await _communityService.GetUserRoleAsync(id, userId, ct);
            if (role != "owner" && role != "moderator") return Forbid();

            var stats = await _communityService.GetCommunityStatsAsync(id, ct);
            return Ok(stats);
        }

        // POST api/communities/{id}/moderators/{userId} — promote to moderator
        [Authorize]
        [HttpPost("{id:int}/moderators/{targetUserId:int}")]
        public async Task<IActionResult> Promote(int id, int targetUserId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.PromoteToModeratorAsync(id, targetUserId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // DELETE api/communities/{id}/moderators/{userId} — demote from moderator
        [Authorize]
        [HttpDelete("{id:int}/moderators/{targetUserId:int}")]
        public async Task<IActionResult> Demote(int id, int targetUserId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.DemoteFromModeratorAsync(id, targetUserId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // DELETE api/communities/{id}/members/{userId} — kick member
        [Authorize]
        [HttpDelete("{id:int}/members/{targetUserId:int}")]
        public async Task<IActionResult> Kick(int id, int targetUserId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.KickMemberAsync(id, targetUserId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // POST api/communities/{id}/ban/{userId} — ban member
        [Authorize]
        [HttpPost("{id:int}/ban/{targetUserId:int}")]
        public async Task<IActionResult> Ban(int id, int targetUserId, [FromBody] ForumApp.Domain.Models.Community.BanMemberDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.BanMemberAsync(id, targetUserId, requestingUserId, dto.Reason, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // DELETE api/communities/{id}/ban/{userId} — unban member
        [Authorize]
        [HttpDelete("{id:int}/ban/{targetUserId:int}")]
        public async Task<IActionResult> Unban(int id, int targetUserId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.UnbanMemberAsync(id, targetUserId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // POST api/communities/{id}/transfer/{newOwnerId} — transfer ownership
        [Authorize]
        [HttpPost("{id:int}/transfer/{newOwnerId:int}")]
        public async Task<IActionResult> Transfer(int id, int newOwnerId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _communityService.TransferOwnershipAsync(id, newOwnerId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // GET api/communities/{id}/modlog?actionType=all
        [Authorize]
        [HttpGet("{id:int}/modlog")]
        public async Task<IActionResult> GetModLog(int id, [FromQuery] string? actionType, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var entries = await _communityService.GetModLogAsync(id, userId, actionType, ct);
            return Ok(entries);
        }

        // GET api/communities/{communityId}/posts/pinned — list pinned posts
        [HttpGet("{communityId:int}/posts/pinned")]
        public async Task<IActionResult> GetPinnedPosts(int communityId, CancellationToken ct)
        {
            var batch = await _postService.GetPinnedPostsAsync(communityId, ct);
            return Ok(batch);
        }

        // POST api/communities/{communityId}/posts/{postId}/pin — pin a post
        [Authorize]
        [HttpPost("{communityId:int}/posts/{postId:int}/pin")]
        public async Task<IActionResult> PinPost(int communityId, int postId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _postService.PinPostAsync(postId, communityId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // DELETE api/communities/{communityId}/posts/{postId}/pin — unpin a post
        [Authorize]
        [HttpDelete("{communityId:int}/posts/{postId:int}/pin")]
        public async Task<IActionResult> UnpinPost(int communityId, int postId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _postService.UnpinPostAsync(postId, communityId, requestingUserId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        // Returns null if user is not authenticated (used for optional auth endpoints)
        private int? TryGetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            if (claim == null) return null;
            if (int.TryParse(claim.Value, out var id)) return id;
            return null;
        }
    }
}
