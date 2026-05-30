using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Report;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IReportAction _reportService;

        public ReportController(IReportAction reportService)
        {
            _reportService = reportService;
        }

        // POST api/report — authenticated user submits a report
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] ReportCreateDto reportData, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var reporterId = GetCurrentUserId();
            var result = await _reportService.CreateReportAsync(reportData, reporterId, ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // GET api/report — admin only (all reports)
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllReports(CancellationToken ct)
        {
            var reports = await _reportService.GetAllReportsAsync(ct);
            return Ok(reports);
        }

        // GET api/report/community/{communityId} — mod panel: pending reports for a community
        [Authorize]
        [HttpGet("community/{communityId:int}")]
        public async Task<IActionResult> GetCommunityReports(int communityId, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var reports = await _reportService.GetCommunityReportsAsync(communityId, requestingUserId, ct);
            return Ok(reports);
        }

        // POST api/report/{id}/dismiss — mod dismisses a report
        [Authorize]
        [HttpPost("{id:int}/dismiss")]
        public async Task<IActionResult> Dismiss(int id, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _reportService.DismissReportAsync(id, requestingUserId, ct: ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // POST api/report/{id}/remove — mod removes reported content
        [Authorize]
        [HttpPost("{id:int}/remove")]
        public async Task<IActionResult> RemoveContent(int id, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _reportService.RemoveReportedContentAsync(id, requestingUserId, ct: ct);

            if (!result.IsSuccess) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        // DELETE api/report/{id} — admin deletes a report
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteReport(int id, CancellationToken ct)
        {
            var result = await _reportService.DeleteReportAsync(id, ct);
            if (!result.IsSuccess) return NotFound(result.Message);
            return Ok(result.Message);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
