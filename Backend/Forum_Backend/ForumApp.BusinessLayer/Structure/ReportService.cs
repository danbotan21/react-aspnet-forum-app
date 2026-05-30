using ForumApp.DataAccess;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.EntityFrameworkCore;
using ForumApp.Domain.Entities.Comment;

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

        public async Task<ActionResponse> CreateReportAsync(ReportCreateDto reportData, int reporterId, CancellationToken ct = default)
        {
            try
            {
                // Validari de bază
                if (string.IsNullOrWhiteSpace(reportData.Reason) || reportData.Reason.Length < 3)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Please provide a report reason."
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

                // Anti-spam: 1 rep per user per item
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

                // Optional: Limit max daily reports per user
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

                // Auto-resolve CommunityId from reported item
                int? communityId = null;
                if (reportData.Type == ReportType.Post)
                {
                    var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == reportData.ReportedItemId, ct);
                    communityId = post?.CommunityId;
                }
                else if (reportData.Type == ReportType.Comment)
                {
                    var comment = await _context.Comments
                        .Include(c => c.Post)
                        .FirstOrDefaultAsync(c => c.ID == reportData.ReportedItemId, ct);
                    communityId = comment?.Post?.CommunityId;
                }

                if (communityId.HasValue)
                {
                    var isBanned = await _context.CommunityMembers
                        .AnyAsync(m => m.CommunityId == communityId.Value && m.UserId == reporterId && m.IsBanned, ct);
                    if (isBanned)
                    {
                        return new ActionResponse
                        {
                            IsSuccess = false,
                            Message = "You are banned from this community and cannot submit reports."
                        };
                    }
                }

                var report = new ReportData
                {
                    ReporterId = reporterId,
                    Type = reportData.Type,
                    ReportedItemId = reportData.ReportedItemId,
                    Reason = reportData.Reason,
                    CreatedAt = DateTime.UtcNow,
                    CommunityId = communityId,
                    Status = "pending"
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
                // TODO: Logging la productie: log.Error(ex, "Failed to create report for reporter {ReporterId}", reporterId);
                // Variabila 'ex' va fi folosita pentru logging cand sistemul de logging va fi implementat
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Failed to submit report. Please try again later."
                };
            }
        }

        public async Task<IReadOnlyList<ReportResponseDto>> GetAllReportsAsync(CancellationToken ct = default)
        {
            try
            {
                var reports = await _context.Reports
                    .Include(r => r.Reporter) 
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
                // Logging la productie: log.Error(ex, "Failed to retrieve reports");
                throw new Exception("Failed to retrieve reports.", ex);
            }
        }
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
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Failed to delete report. Please try again later."
                };
            }
        }

        public async Task<IReadOnlyList<CommunityReportResponseDto>> GetCommunityReportsAsync(int communityId, int requestingUserId, CancellationToken ct = default)
        {
            var canAct = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct);

            if (!canAct) return new List<CommunityReportResponseDto>().AsReadOnly();

            // Post reports
            var postReports = await _context.Reports
                .Where(r => r.CommunityId == communityId && r.Status == "pending" && r.Type == ReportType.Post)
                .Include(r => r.Reporter)
                .ToListAsync(ct);

            var postIds = postReports.Select(r => r.ReportedItemId).Distinct().ToList();
            var posts = await _context.Posts
                .Where(p => postIds.Contains(p.Id))
                .Include(p => p.Author)
                .ToDictionaryAsync(p => p.Id, ct);

            // Comment reports
            var commentReports = await _context.Reports
                .Where(r => r.CommunityId == communityId && r.Status == "pending" && r.Type == ReportType.Comment)
                .Include(r => r.Reporter)
                .ToListAsync(ct);

            var commentIds = commentReports.Select(r => r.ReportedItemId).Distinct().ToList();
            var comments = await _context.Comments
                .Where(c => commentIds.Contains(c.ID))
                .Include(c => c.Author)
                .ToDictionaryAsync(c => c.ID, ct);

            var result = new List<CommunityReportResponseDto>();

            foreach (var report in postReports)
            {
                if (!posts.TryGetValue(report.ReportedItemId, out var post)) continue;
                var preview = post.Body;
                if (preview != null && preview.Length > 300) preview = preview.Substring(0, 300) + "...";
                result.Add(new CommunityReportResponseDto
                {
                    Id = report.Id,
                    TypeName = "Post",
                    Reason = report.Reason,
                    Status = report.Status,
                    CreatedAt = report.CreatedAt,
                    ReporterUserName = report.Reporter.UserName,
                    PostTitle = post.Title,
                    ContentPreview = preview,
                    HasImage = post.ImageUrl != null,
                    PostImageUrl = post.ImageUrl,
                    ContentAuthorUserName = post.Author.UserName,
                    ReportedItemId = report.ReportedItemId,
                    PostId = post.Id
                });
            }

            foreach (var report in commentReports)
            {
                if (!comments.TryGetValue(report.ReportedItemId, out var comment)) continue;
                var preview = comment.Body.Length > 300 ? comment.Body.Substring(0, 300) + "..." : comment.Body;
                result.Add(new CommunityReportResponseDto
                {
                    Id = report.Id,
                    TypeName = "Comment",
                    Reason = report.Reason,
                    Status = report.Status,
                    CreatedAt = report.CreatedAt,
                    ReporterUserName = report.Reporter.UserName,
                    PostTitle = null,
                    ContentPreview = preview,
                    HasImage = false,
                    ContentAuthorUserName = comment.Author.UserName,
                    ReportedItemId = report.ReportedItemId,
                    PostId = comment.PostId
                });
            }

            return result.OrderByDescending(r => r.CreatedAt).ToList().AsReadOnly();
        }

        public async Task<ActionResponse> DismissReportAsync(int reportId, int requestingUserId, CancellationToken ct = default)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
            if (report == null) return new ActionResponse { IsSuccess = false, Message = "Report not found." };

            if (report.CommunityId.HasValue)
            {
                var canAct = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == report.CommunityId.Value && m.UserId == requestingUserId
                                   && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct);
                if (!canAct) return new ActionResponse { IsSuccess = false, Message = "You don't have permission to dismiss this report." };
            }

            report.Status = "dismissed";
            report.ActionedByUserId = requestingUserId;
            report.ActionedAt = DateTime.UtcNow;

            if (report.CommunityId.HasValue)
                _context.ModLogs.Add(new ModLogEntry { CommunityId = report.CommunityId.Value, ActionType = "dismiss", ActorId = requestingUserId, CreatedAt = DateTime.UtcNow, Details = $"Report #{report.Id}" });

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to dismiss report." }; }

            return new ActionResponse { IsSuccess = true, Message = "Report dismissed." };
        }

        public async Task<ActionResponse> RemoveReportedContentAsync(int reportId, int requestingUserId, CancellationToken ct = default)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
            if (report == null) return new ActionResponse { IsSuccess = false, Message = "Report not found." };

            if (report.CommunityId.HasValue)
            {
                var canAct = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == report.CommunityId.Value && m.UserId == requestingUserId
                                   && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct);
                if (!canAct) return new ActionResponse { IsSuccess = false, Message = "You don't have permission to remove content." };
            }

            if (report.Type == ReportType.Post)
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == report.ReportedItemId, ct);
                if (post != null) _context.Posts.Remove(post);
            }
            else if (report.Type == ReportType.Comment)
            {
                var comment = await _context.Comments.FirstOrDefaultAsync(c => c.ID == report.ReportedItemId, ct);
                if (comment != null) _context.Comments.Remove(comment);
            }

            // Mark all reports for the same item as actioned
            var relatedReports = await _context.Reports
                .Where(r => r.Type == report.Type && r.ReportedItemId == report.ReportedItemId && r.Status == "pending")
                .ToListAsync(ct);

            foreach (var r in relatedReports)
            {
                r.Status = "actioned";
                r.ActionedByUserId = requestingUserId;
                r.ActionedAt = DateTime.UtcNow;
            }

            if (report.CommunityId.HasValue)
            {
                var targetPostId = report.Type == ReportType.Post ? (int?)report.ReportedItemId : null;
                _context.ModLogs.Add(new ModLogEntry { CommunityId = report.CommunityId.Value, ActionType = "remove", ActorId = requestingUserId, TargetPostId = targetPostId, CreatedAt = DateTime.UtcNow, Details = $"Report #{report.Id}" });
            }

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to remove content." }; }

            return new ActionResponse { IsSuccess = true, Message = "Content removed and report actioned." };
        }
    }
}
