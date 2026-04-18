using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Vote;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class VoteController : ControllerBase
    {
        private readonly IVoteActions _voteService;

        public VoteController(IVoteActions voteService)
        {
            _voteService = voteService;
        }

        /// <summary>
        /// Create or update a vote on a post or comment
        /// </summary>
        /// <param name="voteData">Vote data (PostId OR CommentId + Type)</param>
        /// <param name="userId">User ID (temporarily hardcoded, will come from JWT later)</param>
        [HttpPost]
        public async Task<IActionResult> Vote([FromBody] CreateVoteRequestDTO voteData, [FromQuery] int userId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _voteService.VoteAsync(voteData, userId);

            if (result == null)
                return BadRequest(new { message = "Invalid vote data. Provide either PostId OR CommentId." });

            return Ok(result);
        }

        /// <summary>
        /// Update an existing vote (change from Upvote to Downvote or vice versa)
        /// </summary>
        /// <param name="voteId">Vote ID</param>
        /// <param name="voteData">Updated vote type</param>
        /// <param name="userId">User ID</param>
        [HttpPut("{voteId}")]
        public async Task<IActionResult> UpdateVote(int voteId, [FromBody] UpdateVoteRequestDTO voteData, [FromQuery] int userId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _voteService.UpdateVoteAsync(voteData, voteId, userId);

            if (result == null)
                return NotFound(new { message = "Vote not found or unauthorized" });

            return Ok(result);
        }

        /// <summary>
        /// Remove a vote
        /// </summary>
        /// <param name="voteId">Vote ID</param>
        /// <param name="userId">User ID</param>
        [HttpDelete("{voteId}")]
        public async Task<IActionResult> RemoveVote(int voteId, [FromQuery] int userId)
        {
            var result = await _voteService.RemoveVoteAsync(voteId, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get a specific vote by ID
        /// </summary>
        /// <param name="voteId">Vote ID</param>
        [HttpGet("{voteId}")]
        public async Task<IActionResult> GetVoteById(int voteId)
        {
            var result = await _voteService.GetVoteByIdAsync(voteId);

            if (result == null)
                return NotFound(new { message = "Vote not found" });

            return Ok(result);
        }

        /// <summary>
        /// Get all votes (for admin/debugging)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllVotes()
        {
            var result = await _voteService.GetAllVotesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get user's vote on a specific post
        /// </summary>
        /// <param name="postId">Post ID</param>
        /// <param name="userId">User ID</param>
        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetUserVoteOnPost(int postId, [FromQuery] int userId)
        {
            var result = await _voteService.GetUserVoteOnPostAsync(postId, userId);

            if (result == null)
                return NotFound(new { message = "No vote found for this post" });

            return Ok(result);
        }

        /// <summary>
        /// Get user's vote on a specific comment
        /// </summary>
        /// <param name="commentId">Comment ID</param>
        /// <param name="userId">User ID</param>
        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> GetUserVoteOnComment(int commentId, [FromQuery] int userId)
        {
            var result = await _voteService.GetUserVoteOnCommentAsync(commentId, userId);

            if (result == null)
                return NotFound(new { message = "No vote found for this comment" });

            return Ok(result);
        }
    }
}
