using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Comment;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentActions _commentService;

        public CommentsController(ICommentActions commentService)
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
            var comments = await _commentService.GetCommentsByPostAsync(postId, ct);
            return Ok(comments);
        }

        // GET api/comments/user/{userId}
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
        {
            var comments = await _commentService.GetCommentsByUserAsync(userId, ct);
            return Ok(comments);
        }

        // POST api/comments?authorId=1
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto commentData, [FromQuery] int authorId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _commentService.CreateCommentAsync(commentData, authorId, ct);

            if (created == null)
                return BadRequest("Post not found, parent comment invalid, or comment could not be saved.");

            return CreatedAtAction(nameof(GetById), new { id = created.ID }, created);
        }

        // PUT api/comments/{id}?requestingUserId=1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommentCreateDto commentData, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _commentService.UpdateCommentAsync(id, commentData, requestingUserId, ct);

            if (updated == null)
                return NotFound("Comment not found or you are not the author.");

            return Ok(updated);
        }

        // DELETE api/comments/{id}?requestingUserId=1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            var result = await _commentService.DeleteCommentAsync(id, requestingUserId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }
    }
}
