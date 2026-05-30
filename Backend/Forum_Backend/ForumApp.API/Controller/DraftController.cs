using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Draft;
using System.Security.Claims;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DraftController : ControllerBase
    {
        private readonly IDraftAction _draftService;

        public DraftController(IDraftAction draftService)
        {
            _draftService = draftService;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        [HttpPost]
        public async Task<IActionResult> CreateDraft([FromBody] CreateDraftRequestDto draftData)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _draftService.CreateDraftAsync(draftData, userId.Value);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{draftId}")]
        public async Task<IActionResult> UpdateDraft(int draftId, [FromBody] UpdateDraftRequestDto draftData)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _draftService.UpdateDraftAsync(draftData, draftId, userId.Value);

            if (result == null)
                return NotFound(new { message = "Draft not found or unauthorized" });

            return Ok(result);
        }

        [HttpGet("{draftId}")]
        public async Task<IActionResult> GetDraftById(int draftId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _draftService.GetDraftByIdAsync(draftId, userId.Value);

            if (result == null)
                return NotFound(new { message = "Draft not found or unauthorized" });

            return Ok(result);
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetAllUserDrafts()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _draftService.GetAllUserDraftsAsync(userId.Value);
            return Ok(result);
        }

        [HttpDelete("{draftId}")]
        public async Task<IActionResult> DeleteDraft(int draftId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var result = await _draftService.DeleteDraftAsync(draftId, userId.Value);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
