using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Community;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommunitiesController : ControllerBase
    {
        private readonly ICommunityActions _communityService;

        public CommunitiesController(ICommunityActions communityService)
        {
            _communityService = communityService;
        }

        // GET api/communities
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var communities = await _communityService.GetAllCommunitiesAsync(ct);
            return Ok(communities);
        }

        // GET api/communities/type/{type}
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetByType(string type, CancellationToken ct)
        {
            var communities = await _communityService.GetAllCommunitiesByTypeAsync(type, ct);
            return Ok(communities);
        }

        // GET api/communities/user/{userId}
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
        {
            var communities = await _communityService.GetCommunitiesByUserAsync(userId, ct);
            return Ok(communities);
        }

        // GET api/communities/search?term=programming
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string term, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(term))
                return BadRequest("Search term cannot be empty.");

            var communities = await _communityService.SearchCommunitiesAsync(term, ct);
            return Ok(communities);
        }

        // GET api/communities/{slug}
        [HttpGet("{slug}")]
        public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
        {
            var community = await _communityService.GetCommunityAsync(slug, ct);

            if (community == null)
                return NotFound($"Community '{slug}' was not found.");

            return Ok(community);
        }

        // GET api/communities/{communityId}/ismember?userId=1
        [HttpGet("{communityId:int}/ismember")]
        public async Task<IActionResult> IsMember(int communityId, [FromQuery] int userId, CancellationToken ct)
        {
            var result = await _communityService.IsMemberAsync(communityId, userId, ct);
            return Ok(result);
        }

        // POST api/communities?authorId=1
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommunityCreateDto communityData, [FromQuery] int authorId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _communityService.CreateCommunityAsync(communityData, authorId, ct);

            if (created == null)
                return BadRequest("A community with this slug already exists or could not be created.");

            return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);
        }

        // PUT api/communities/{id}?requestingUserId=1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommunityUpdateDto communityData, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _communityService.UpdateCommunityAsync(id, communityData, requestingUserId, ct);

            if (updated == null)
                return NotFound("Community not found or you do not have permission to update it.");

            return Ok(updated);
        }

        // DELETE api/communities/{id}?requestingUserId=1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            var result = await _communityService.DeleteCommunityAsync(id, requestingUserId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        // POST api/communities/{id}/join?userId=1
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id, [FromQuery] int userId, CancellationToken ct)
        {
            var result = await _communityService.JoinCommunityAsync(id, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        // DELETE api/communities/{id}/leave?userId=1
        [HttpDelete("{id:int}/leave")]
        public async Task<IActionResult> Leave(int id, [FromQuery] int userId, CancellationToken ct)
        {
            var result = await _communityService.LeaveCommunityAsync(id, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }
    }
}
