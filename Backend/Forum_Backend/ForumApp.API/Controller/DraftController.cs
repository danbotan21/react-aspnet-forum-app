using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Draft;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class DraftController : ControllerBase
    {
        private readonly IDraftActions _draftService;

        public DraftController(IDraftActions draftService)
        {
            _draftService = draftService;
        }

        /// <summary>
        /// Create a new draft
        /// </summary>
        /// <param name="draftData">Draft data (PostId)</param>
        /// <param name="authorId">Author ID (temporarily from query, will come from JWT later)</param>
        [HttpPost]
        public async Task<IActionResult> CreateDraft([FromBody] CreateDraftRequestDTO draftData, [FromQuery] int authorId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _draftService.CreateDraftAsync(draftData, authorId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing draft
        /// </summary>
        /// <param name="draftId">Draft ID</param>
        /// <param name="draftData">Updated draft data</param>
        /// <param name="authorId">Author ID</param>
        [HttpPut("{draftId}")]
        public async Task<IActionResult> UpdateDraft(int draftId, [FromBody] UpdateDraftRequestDTO draftData, [FromQuery] int authorId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _draftService.UpdateDraftAsync(draftData, draftId, authorId);

            if (result == null)
                return NotFound(new { message = "Draft not found or unauthorized" });

            return Ok(result);
        }

        /// <summary>
        /// Get a specific draft by ID (only author can view)
        /// </summary>
        /// <param name="draftId">Draft ID</param>
        /// <param name="authorId">Author ID</param>
        [HttpGet("{draftId}")]
        public async Task<IActionResult> GetDraftById(int draftId, [FromQuery] int authorId)
        {
            var result = await _draftService.GetDraftByIdAsync(draftId, authorId);

            if (result == null)
                return NotFound(new { message = "Draft not found or unauthorized" });

            return Ok(result);
        }

        /// <summary>
        /// Get all drafts for a specific user
        /// </summary>
        /// <param name="authorId">Author ID</param>
        [HttpGet("user")]
        public async Task<IActionResult> GetAllUserDrafts([FromQuery] int authorId)
        {
            var result = await _draftService.GetAllUserDraftsAsync(authorId);
            return Ok(result);
        }

        /// <summary>
        /// Delete a draft (only author can delete)
        /// </summary>
        /// <param name="draftId">Draft ID</param>
        /// <param name="authorId">Author ID</param>
        [HttpDelete("{draftId}")]
        public async Task<IActionResult> DeleteDraft(int draftId, [FromQuery] int authorId)
        {
            var result = await _draftService.DeleteDraftAsync(draftId, authorId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
