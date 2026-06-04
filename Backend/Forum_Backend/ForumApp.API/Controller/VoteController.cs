using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Vote;
using Microsoft.AspNetCore.Authorization;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class VoteController : ControllerBase
    {
        private readonly IVoteAction _voteService;

        public VoteController(IVoteAction voteService)
        {
            _voteService = voteService;
        }

        // POST api/vote
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Vote([FromBody] CreateVoteRequestDto voteData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _voteService.VoteAsync(voteData, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Error });

            return Ok(result.Data);
        }

        // PUT api/vote/{voteId}
        [Authorize]
        [HttpPut("{voteId}")]
        public async Task<IActionResult> UpdateVote(int voteId, [FromBody] UpdateVoteRequestDto voteData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _voteService.UpdateVoteAsync(voteData, voteId, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Error });

            return Ok(result.Data);
        }

        // DELETE api/vote/{voteId}
        [Authorize]
        [HttpDelete("{voteId}")]
        public async Task<IActionResult> RemoveVote(int voteId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _voteService.RemoveVoteAsync(voteId, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/vote/{voteId}
        [HttpGet("{voteId}")]
        public async Task<IActionResult> GetVoteById(int voteId, CancellationToken ct)
        {
            var result = await _voteService.GetVoteByIdAsync(voteId, ct);

            if (result == null)
                return NotFound(new { message = "Vote not found" });

            return Ok(result);
        }

        // GET api/vote/mine — returns all votes for the authenticated user
        [Authorize]
        [HttpGet("mine")]
        public async Task<IActionResult> GetMyVotes(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _voteService.GetUserVotesAsync(userId, ct);
            return Ok(result);
        }

        // GET api/vote/post/{postId} — returns the authenticated user's vote on a post
        [Authorize]
        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetUserVoteOnPost(int postId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _voteService.GetUserVoteOnPostAsync(postId, userId, ct);

            if (result == null)
                return Ok(null);

            return Ok(result);
        }

        // GET api/vote/comment/{commentId} — returns the authenticated user's vote on a comment
        [Authorize]
        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> GetUserVoteOnComment(int commentId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _voteService.GetUserVoteOnCommentAsync(commentId, userId, ct);

            if (result == null)
                return Ok(null);

            return Ok(result);
        }

        // GET api/vote/user/{userId} — public: all post votes cast by a specific user
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetVotesByUser(int userId, CancellationToken ct)
        {
            var result = await _voteService.GetUserVotesAsync(userId, ct);
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
