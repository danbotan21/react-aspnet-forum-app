using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Comment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentAction _commentService;

        public CommentsController(ICommentAction commentService)
        {
            _commentService = commentService;
        }

        // GET api/comments/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var comment = await _commentService.GetCommentByIdAsync(id, ct);

            if (comment == null)
                return NotFound($"Comment with id {id} was not found.");

            return Ok(comment);
        }

        // GET api/comments/post/{postId}
        [HttpGet("post/{postId:int}")]
        public async Task<IActionResult> GetByPost(int postId, CancellationToken ct)
        {
            int? requestingUserId = TryGetCurrentUserId();
            var comments = await _commentService.GetCommentsByPostAsync(postId, requestingUserId, ct);
            return Ok(comments);
        }

        // GET api/comments/user/{userId}
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
        {
            var comments = await _commentService.GetCommentsByUserAsync(userId, ct);
            return Ok(comments);
        }

        // POST api/comments
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto commentData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var authorId = GetCurrentUserId();
            var created = await _commentService.CreateCommentAsync(commentData, authorId, ct);

            if (created == null)
                return BadRequest("Comment could not be created. Ensure post exists, parent comment is valid, and user is a member of the community.");

            return CreatedAtAction(nameof(GetById), new { id = created.ID }, created);
        }

        // PUT api/comments/{id}
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommentCreateDto commentData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requestingUserId = GetCurrentUserId();
            var updated = await _commentService.UpdateCommentAsync(id, commentData, requestingUserId, ct);

            if (updated == null)
                return NotFound("Comment not found or you are not the author.");

            return Ok(updated);
        }

        // DELETE api/comments/{id}
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _commentService.DeleteCommentAsync(id, requestingUserId, ct: ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

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
