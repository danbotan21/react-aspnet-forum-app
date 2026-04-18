using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class ReportService : IReportActions
    {
        private readonly ForumDbContext _context;

        // Constructor - Dependency Injection pentru DbContext
        public ReportService(ForumDbContext context)
        {
            _context = context;
        }

        // Creează un raport nou
        public async Task<ActionResponse> CreateReportAsync(ReportCreateDto reportData, int reporterId, CancellationToken ct = default)
        {
            try
            {
                // Validări de bază
                if (string.IsNullOrWhiteSpace(reportData.Reason) || reportData.Reason.Length < 10)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Report reason must be at least 10 characters long."
                    };
                }

                if (reportData.ReportedItemId <= 0)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Invalid reported item ID."
                    };
                }

                // Anti-spam: Verifică dacă userul nu a raportat același item deja
                var existingReport = await _context.Reports
                    .AnyAsync(r => r.ReporterId == reporterId 
                                && r.ReportedItemId == reportData.ReportedItemId 
                                && r.Type == reportData.Type, ct);

                if (existingReport)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "You have already reported this item."
                    };
                }

                // Optional: Limită de rapoarte per zi (ex: max 10 rapoarte pe zi)
                var reportsToday = await _context.Reports
                    .CountAsync(r => r.ReporterId == reporterId 
                                  && r.CreatedAt > DateTime.UtcNow.AddDays(-1), ct);

                if (reportsToday >= 10)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "You have reached the maximum number of reports for today."
                    };
                }

                var report = new ReportData
                {
                    ReporterId = reporterId,
                    Type = reportData.Type,
                    ReportedItemId = reportData.ReportedItemId,
                    Reason = reportData.Reason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse
                {
                    IsSuccess = true,
                    Message = "Report submitted successfully. Thank you for helping keep our community safe."
                };
            }
            catch (Exception ex)
            {
                // TODO: Logging în producție: log.Error(ex, "Failed to create report for reporter {ReporterId}", reporterId);
                // Variabila 'ex' va fi folosită pentru logging când sistemul de logging va fi implementat
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Failed to submit report. Please try again later."
                };
            }
        }

        // Obține toate rapoartele (pentru admin)
        public async Task<IReadOnlyList<ReportResponseDto>> GetAllReportsAsync(CancellationToken ct = default)
        {
            try
            {
                var reports = await _context.Reports
                    .Include(r => r.Reporter) // Include user info pentru a știi cine a raportat
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new ReportResponseDto
                    {
                        ReporterId = r.ReporterId,
                        Type = r.Type,
                        ReportedItemId = r.ReportedItemId,
                        Reason = r.Reason
                    })
                    .ToListAsync(ct);

                return reports;
            }
            catch (Exception ex)
            {
                // Logging în producție: log.Error(ex, "Failed to retrieve reports");
                throw new Exception("Failed to retrieve reports.", ex);
            }
        }

        // Șterge un raport (după ce a fost procesat de admin)
        public async Task<ActionResponse> DeleteReportAsync(int reportId, CancellationToken ct = default)
        {
            try
            {
                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == reportId, ct);

                if (report == null)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Report not found."
                    };
                }

                _context.Reports.Remove(report);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse
                {
                    IsSuccess = true,
                    Message = "Report deleted successfully."
                };
            }
            catch (Exception ex)
            {
                // TODO: Logging în producție: log.Error(ex, "Failed to delete report {ReportId}", reportId);
                // Variabila 'ex' va fi folosită pentru logging când sistemul de logging va fi implementat
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Failed to delete report. Please try again later."
                };
            }
        }
    }
}
