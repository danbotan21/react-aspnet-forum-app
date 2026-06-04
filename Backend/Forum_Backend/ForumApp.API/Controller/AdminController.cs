using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Admin;

namespace ForumApp.API.Controller
{
    // Application-wide administration panel. Every endpoint requires the global "Admin" role.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminAction _adminService;
        private readonly IReportAction _reportService;
        private readonly IPostAction _postService;
        private readonly ICommentAction _commentService;
        private readonly ICommunityAction _communityService;
        private readonly IContactAction _contactService;

        public AdminController(
            IAdminAction adminService,
            IReportAction reportService,
            IPostAction postService,
            ICommentAction commentService,
            ICommunityAction communityService,
            IContactAction contactService)
        {
            _adminService = adminService;
            _reportService = reportService;
            _postService = postService;
            _commentService = commentService;
            _communityService = communityService;
            _contactService = contactService;
        }

        // ─── DASHBOARD ───────────────────────────────────────────────────────────

        // GET api/admin/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(CancellationToken ct)
            => Ok(await _adminService.GetStatsAsync(ct));

        // ─── USERS ─────────────────────────────────────────────────────────────────

        // GET api/admin/users?search=dan
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, CancellationToken ct)
            => Ok(await _adminService.GetUsersAsync(search, ct));

        // POST api/admin/users/{id}/ban
        [HttpPost("users/{id:int}/ban")]
        public async Task<IActionResult> BanUser(int id, [FromBody] BanUserDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _adminService.BanUserAsync(id, dto.Reason, GetCurrentUserId(), ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // POST api/admin/users/{id}/unban
        [HttpPost("users/{id:int}/unban")]
        public async Task<IActionResult> UnbanUser(int id, CancellationToken ct)
        {
            var result = await _adminService.UnbanUserAsync(id, GetCurrentUserId(), ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // POST api/admin/users/{id}/role  { "role": "Admin" | "User" }
        [HttpPost("users/{id:int}/role")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _adminService.ChangeUserRoleAsync(id, dto.Role, GetCurrentUserId(), ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // ─── COMMUNITIES ─────────────────────────────────────────────────────────────

        // GET api/admin/communities
        [HttpGet("communities")]
        public async Task<IActionResult> GetCommunities(CancellationToken ct)
            => Ok(await _adminService.GetCommunitiesAsync(ct));

        // DELETE api/admin/communities/{id}
        [HttpDelete("communities/{id:int}")]
        public async Task<IActionResult> DeleteCommunity(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _communityService.DeleteCommunityAsync(id, adminId, isPrivileged: true, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "delete_community", "community", id, $"community #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // ─── CONTENT (delete anything, anywhere) ─────────────────────────────────────

        // GET api/admin/posts?search=&page=1&pageSize=20
        [HttpGet("posts")]
        public async Task<IActionResult> GetPosts([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
            => Ok(await _adminService.GetPostsAsync(search, page, pageSize, ct));

        // GET api/admin/comments?search=&page=1&pageSize=20
        [HttpGet("comments")]
        public async Task<IActionResult> GetComments([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
            => Ok(await _adminService.GetCommentsAsync(search, page, pageSize, ct));

        // DELETE api/admin/posts/{id}
        [HttpDelete("posts/{id:int}")]
        public async Task<IActionResult> DeletePost(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _postService.DeletePostAsync(id, adminId, isPrivileged: true, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "delete_post", "post", id, $"post #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // DELETE api/admin/comments/{id}
        [HttpDelete("comments/{id:int}")]
        public async Task<IActionResult> DeleteComment(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _commentService.DeleteCommentAsync(id, adminId, isPrivileged: true, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "delete_comment", "comment", id, $"comment #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // ─── REPORTS (across all communities) ────────────────────────────────────────

        // GET api/admin/reports?status=pending
        [HttpGet("reports")]
        public async Task<IActionResult> GetReports([FromQuery] string? status, CancellationToken ct)
            => Ok(await _adminService.GetReportsAsync(status, ct));

        // POST api/admin/reports/{id}/dismiss
        [HttpPost("reports/{id:int}/dismiss")]
        public async Task<IActionResult> DismissReport(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _reportService.DismissReportAsync(id, adminId, isPrivileged: true, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "report_dismiss", "report", id, $"report #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // POST api/admin/reports/{id}/remove  — deletes the reported post/comment
        [HttpPost("reports/{id:int}/remove")]
        public async Task<IActionResult> RemoveReportedContent(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _reportService.RemoveReportedContentAsync(id, adminId, isPrivileged: true, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "report_remove", "report", id, $"report #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // DELETE api/admin/reports/{id}  — discards the report record itself
        [HttpDelete("reports/{id:int}")]
        public async Task<IActionResult> DeleteReport(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _reportService.DeleteReportAsync(id, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "report_discard", "report", id, $"report #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : NotFound(result.Message);
        }

        // ─── MESSAGES (Contact Us inbox) ─────────────────────────────────────────────

        // GET api/admin/messages
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages(CancellationToken ct)
            => Ok(await _contactService.GetAllMessagesAsync(ct));

        // POST api/admin/messages/{id}/reply
        [HttpPost("messages/{id:int}/reply")]
        public async Task<IActionResult> ReplyToMessage(int id, [FromBody] ReplyMessageDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _adminService.ReplyToMessageAsync(id, dto.Reply, GetCurrentUserId(), ct);
            return result.IsSuccess ? Ok(result.Message) : BadRequest(result.Message);
        }

        // DELETE api/admin/messages/{id}
        [HttpDelete("messages/{id:int}")]
        public async Task<IActionResult> DeleteMessage(int id, CancellationToken ct)
        {
            var adminId = GetCurrentUserId();
            var result = await _contactService.DeleteMessageAsync(id, ct);
            if (result.IsSuccess)
                await _adminService.LogActionAsync(adminId, "delete_message", "message", id, $"message #{id}", null, ct);
            return result.IsSuccess ? Ok(result.Message) : NotFound(result.Message);
        }

        // ─── AUDIT LOG ───────────────────────────────────────────────────────────────

        // GET api/admin/logs?limit=100
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs([FromQuery] int limit = 100, CancellationToken ct = default)
            => Ok(await _adminService.GetLogsAsync(limit, ct));

        // DELETE api/admin/logs — clears the entire audit log
        [HttpDelete("logs")]
        public async Task<IActionResult> ClearLogs(CancellationToken ct = default)
            => Ok(await _adminService.ClearLogsAsync(ct));

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
