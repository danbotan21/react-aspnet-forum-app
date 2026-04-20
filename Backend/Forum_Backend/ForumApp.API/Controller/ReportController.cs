using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Report;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IReportActions _reportService;

        public ReportController(IReportActions reportService)
        {
            _reportService = reportService;
        }

        /// <summary>
        /// Create a new report
        /// </summary>
        /// <param name="reportData">Report creation data</param>
        /// <returns>ActionResponse indicating success or failure</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateReport([FromBody] ReportCreateDto reportData, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // TODO: Get userId from authentication context when auth is implemented
            // For now, using reporterId from the DTO
            int reporterId = reportData.ReporterId;

            var result = await _reportService.CreateReportAsync(reportData, reporterId, ct);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetAllReports), result);
        }

        /// <summary>
        /// Get all reports (Admin only - add authorization later)
        /// </summary>
        /// <returns>List of all reports</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllReports(CancellationToken ct = default)
        {
            try
            {
                var reports = await _reportService.GetAllReportsAsync(ct);
                return Ok(reports);
            }
            catch (Exception ex)
            {
                // Log error in production
                return StatusCode(500, new { message = "Failed to retrieve reports." });
            }
        }

        /// <summary>
        /// Delete a report by ID (Admin only - add authorization later)
        /// </summary>
        /// <param name="id">Report ID</param>
        /// <returns>ActionResponse indicating success or failure</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteReport(int id, CancellationToken ct = default)
        {
            var result = await _reportService.DeleteReportAsync(id, ct);

            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
    }
}
