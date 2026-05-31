using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.SavedItem;
using Microsoft.AspNetCore.Authorization;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SavedItemController : ControllerBase
    {
        private readonly ISavedItemAction _savedItemService;

        public SavedItemController(ISavedItemAction savedItemService)
        {
            _savedItemService = savedItemService;
        }

        // POST api/saveditem
        [HttpPost]
        public async Task<IActionResult> SaveItem([FromBody] CreateSavedItemRequestDto itemData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var result = await _savedItemService.SaveItemAsync(itemData, userId, ct);

            if (result == null)
                return BadRequest(new { message = "Invalid data. Provide either PostId OR CommentId." });

            return Ok(result);
        }

        // DELETE api/saveditem/{savedItemId}
        [HttpDelete("{savedItemId}")]
        public async Task<IActionResult> RemoveSavedItem(int savedItemId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _savedItemService.RemoveSavedItemAsync(savedItemId, userId, ct);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        // GET api/saveditem/{savedItemId}
        [HttpGet("{savedItemId}")]
        public async Task<IActionResult> GetSavedItemById(int savedItemId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _savedItemService.GetSavedItemByIdAsync(savedItemId, userId, ct);

            if (result == null)
                return NotFound(new { message = "Saved item not found or unauthorized" });

            return Ok(result);
        }

        // GET api/saveditem/user — returns saved items for the authenticated user
        [HttpGet("user")]
        public async Task<IActionResult> GetSavedItemsByUser(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _savedItemService.GetSavedItemsByUserAsync(userId, ct);
            return Ok(result);
        }

        // GET api/saveditem/user/{userId} — public: saved items for any user
        [AllowAnonymous]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetSavedItemsByUserId(int userId, CancellationToken ct)
        {
            var result = await _savedItemService.GetSavedItemsByUserAsync(userId, ct);
            return Ok(result);
        }

        // GET api/saveditem/post/{postId}
        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetUserSavedPost(int postId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _savedItemService.GetUserSavedPostAsync(postId, userId, ct);

            if (result == null)
                return NotFound(new { message = "This post is not saved by the user" });

            return Ok(result);
        }

        // GET api/saveditem/comment/{commentId}
        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> GetUserSavedComment(int commentId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _savedItemService.GetUserSavedCommentAsync(commentId, userId, ct);

            if (result == null)
                return NotFound(new { message = "This comment is not saved by the user" });

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
