using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.SavedItem;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class SavedItemController : ControllerBase
    {
        private readonly ISavedItemActions _savedItemService;

        public SavedItemController(ISavedItemActions savedItemService)
        {
            _savedItemService = savedItemService;
        }

        /// <summary>
        /// Save a post or comment for later
        /// </summary>
        /// <param name="itemData">Item data (PostId OR CommentId)</param>
        /// <param name="userId">User ID (temporarily from query, will come from JWT later)</param>
        [HttpPost]
        public async Task<IActionResult> SaveItem([FromBody] CreateSavedItemRequestDTO itemData, [FromQuery] int userId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _savedItemService.SaveItemAsync(itemData, userId);

            if (result == null)
                return BadRequest(new { message = "Invalid data. Provide either PostId OR CommentId." });

            return Ok(result);
        }

        /// <summary>
        /// Remove a saved item
        /// </summary>
        /// <param name="savedItemId">Saved item ID</param>
        /// <param name="userId">User ID</param>
        [HttpDelete("{savedItemId}")]
        public async Task<IActionResult> RemoveSavedItem(int savedItemId, [FromQuery] int userId)
        {
            var result = await _savedItemService.RemoveSavedItemAsync(savedItemId, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get a specific saved item by ID (only owner can view)
        /// </summary>
        /// <param name="savedItemId">Saved item ID</param>
        /// <param name="userId">User ID</param>
        [HttpGet("{savedItemId}")]
        public async Task<IActionResult> GetSavedItemById(int savedItemId, [FromQuery] int userId)
        {
            var result = await _savedItemService.GetSavedItemByIdAsync(savedItemId, userId);

            if (result == null)
                return NotFound(new { message = "Saved item not found or unauthorized" });

            return Ok(result);
        }

        /// <summary>
        /// Get all saved items for a specific user
        /// </summary>
        /// <param name="userId">User ID</param>
        [HttpGet("user")]
        public async Task<IActionResult> GetSavedItemsByUser([FromQuery] int userId)
        {
            var result = await _savedItemService.GetSavedItemsByUserAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Check if a specific post is saved by the user
        /// </summary>
        /// <param name="postId">Post ID</param>
        /// <param name="userId">User ID</param>
        [HttpGet("post/{postId}")]
        public async Task<IActionResult> GetUserSavedPost(int postId, [FromQuery] int userId)
        {
            var result = await _savedItemService.GetUserSavedPostAsync(postId, userId);

            if (result == null)
                return NotFound(new { message = "This post is not saved by the user" });

            return Ok(result);
        }

        /// <summary>
        /// Check if a specific comment is saved by the user
        /// </summary>
        /// <param name="commentId">Comment ID</param>
        /// <param name="userId">User ID</param>
        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> GetUserSavedComment(int commentId, [FromQuery] int userId)
        {
            var result = await _savedItemService.GetUserSavedCommentAsync(commentId, userId);

            if (result == null)
                return NotFound(new { message = "This comment is not saved by the user" });

            return Ok(result);
        }
    }
}
