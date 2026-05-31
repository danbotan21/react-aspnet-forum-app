using ForumApp.DataAccess;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class ReportActions
    {
        protected readonly ForumDbContext _context;

        public ReportActions(ForumDbContext context)
        {
            _context = context;
        }

        internal async Task<ActionResponse> CreateReportExecution(ReportCreateDto reportData, int reporterId, CancellationToken ct = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reportData.Reason) || reportData.Reason.Length < 3)
                    return new ActionResponse { IsSuccess = false, Message = "Please provide a report reason." };

                if (reportData.ReportedItemId <= 0)
                    return new ActionResponse { IsSuccess = false, Message = "Invalid reported item ID." };

                var existingReport = await _context.Reports
                    .AnyAsync(r => r.ReporterId == reporterId
                                && r.ReportedItemId == reportData.ReportedItemId
                                && r.Type == reportData.Type, ct);

                if (existingReport)
                    return new ActionResponse { IsSuccess = false, Message = "You have already reported this item." };

                var reportsToday = await _context.Reports
                    .CountAsync(r => r.ReporterId == reporterId && r.CreatedAt > DateTime.UtcNow.AddDays(-1), ct);

                if (reportsToday >= 10)
                    return new ActionResponse { IsSuccess = false, Message = "You have reached the maximum number of reports for today." };

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
                        return new ActionResponse { IsSuccess = false, Message = "You are banned from this community and cannot submit reports." };
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

                return new ActionResponse { IsSuccess = true, Message = "Report submitted successfully. Thank you for helping keep our community safe." };
            }
            catch (Exception)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to submit report. Please try again later." };
            }
        }

        internal async Task<IReadOnlyList<ReportResponseDto>> GetAllReportsExecution(CancellationToken ct = default)
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

        internal async Task<ActionResponse> DeleteReportExecution(int reportId, CancellationToken ct = default)
        {
            try
            {
                var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);

                if (report == null)
                    return new ActionResponse { IsSuccess = false, Message = "Report not found." };

                _context.Reports.Remove(report);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse { IsSuccess = true, Message = "Report deleted successfully." };
            }
            catch (Exception)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to delete report. Please try again later." };
            }
        }

        // Global admins get owner-level moderation power in any community.
        private Task<bool> IsGlobalAdminAsync(int userId, CancellationToken ct = default)
            => _context.Users.AnyAsync(u => u.ID == userId && u.Role == "Admin", ct);

        internal async Task<IReadOnlyList<CommunityReportResponseDto>> GetCommunityReportsExecution(int communityId, int requestingUserId, CancellationToken ct = default)
        {
            var canAct = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct)
                || await IsGlobalAdminAsync(requestingUserId, ct);

            if (!canAct) return new List<CommunityReportResponseDto>().AsReadOnly();

            var postReports = await _context.Reports
                .Where(r => r.CommunityId == communityId && r.Status == "pending" && r.Type == ReportType.Post)
                .Include(r => r.Reporter)
                .ToListAsync(ct);

            var postIds = postReports.Select(r => r.ReportedItemId).Distinct().ToList();
            var posts = await _context.Posts
                .Where(p => postIds.Contains(p.Id))
                .Include(p => p.Author)
                .ToDictionaryAsync(p => p.Id, ct);

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

        internal async Task<ActionResponse> DismissReportExecution(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
            if (report == null) return new ActionResponse { IsSuccess = false, Message = "Report not found." };

            if (!isPrivileged && report.CommunityId.HasValue)
            {
                var canAct = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == report.CommunityId.Value && m.UserId == requestingUserId
                                   && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct)
                    || await IsGlobalAdminAsync(requestingUserId, ct);
                if (!canAct) return new ActionResponse { IsSuccess = false, Message = "You don't have permission to dismiss this report." };
            }

            report.Status = "dismissed";
            report.ActionedByUserId = requestingUserId;
            report.ActionedAt = DateTime.UtcNow;

            if (report.CommunityId.HasValue)
                _context.ModLogs.Add(new ModLogEntryData { CommunityId = report.CommunityId.Value, ActionType = "dismiss", ActorId = requestingUserId, CreatedAt = DateTime.UtcNow, Details = $"Report #{report.Id}" });

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to dismiss report." }; }

            return new ActionResponse { IsSuccess = true, Message = "Report dismissed." };
        }

        internal async Task<ActionResponse> RemoveReportedContentExecution(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
            if (report == null) return new ActionResponse { IsSuccess = false, Message = "Report not found." };

            if (!isPrivileged && report.CommunityId.HasValue)
            {
                var canAct = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == report.CommunityId.Value && m.UserId == requestingUserId
                                   && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct)
                    || await IsGlobalAdminAsync(requestingUserId, ct);
                if (!canAct) return new ActionResponse { IsSuccess = false, Message = "You don't have permission to remove content." };
            }

            if (report.Type == ReportType.Post)
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == report.ReportedItemId, ct);
                if (post != null)
                {
                    // Clean up all dependent data before removing the post
                    var savedItems = await _context.SavedItems.Where(s => s.PostId == post.Id).ToListAsync(ct);
                    _context.SavedItems.RemoveRange(savedItems);

                    var votes = await _context.Votes.Where(v => v.PostId == post.Id).ToListAsync(ct);
                    _context.Votes.RemoveRange(votes);

                    var commentIds = await _context.Comments
                        .Where(c => c.PostId == post.Id)
                        .Select(c => c.ID)
                        .ToListAsync(ct);

                    if (commentIds.Count > 0)
                    {
                        var commentNotifications = await _context.Notifications
                            .Where(n => n.CommentId != null && commentIds.Contains(n.CommentId!.Value))
                            .ToListAsync(ct);
                        _context.Notifications.RemoveRange(commentNotifications);

                        var commentSavedItems = await _context.SavedItems
                            .Where(s => s.CommentId != null && commentIds.Contains(s.CommentId!.Value))
                            .ToListAsync(ct);
                        _context.SavedItems.RemoveRange(commentSavedItems);

                        var comments = await _context.Comments.Where(c => c.PostId == post.Id).ToListAsync(ct);
                        _context.Comments.RemoveRange(comments);
                    }

                    var postNotifications = await _context.Notifications.Where(n => n.PostId == post.Id).ToListAsync(ct);
                    _context.Notifications.RemoveRange(postNotifications);

                    _context.Posts.Remove(post);
                }
            }
            else if (report.Type == ReportType.Comment)
            {
                var comment = await _context.Comments
                    .Include(c => c.Post)
                    .FirstOrDefaultAsync(c => c.ID == report.ReportedItemId, ct);

                if (comment != null)
                {
                    var commentNotifications = await _context.Notifications
                        .Where(n => n.CommentId == comment.ID)
                        .ToListAsync(ct);
                    _context.Notifications.RemoveRange(commentNotifications);

                    var commentSavedItems = await _context.SavedItems
                        .Where(s => s.CommentId == comment.ID)
                        .ToListAsync(ct);
                    _context.SavedItems.RemoveRange(commentSavedItems);

                    if (comment.Post != null && comment.Post.CommentsCount > 0)
                        comment.Post.CommentsCount--;

                    _context.Comments.Remove(comment);
                }
            }

            // Mark all related pending reports as actioned
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
                _context.ModLogs.Add(new ModLogEntryData { CommunityId = report.CommunityId.Value, ActionType = "remove", ActorId = requestingUserId, TargetPostId = targetPostId, CreatedAt = DateTime.UtcNow, Details = $"Report #{report.Id}" });
            }

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to remove content." }; }

            return new ActionResponse { IsSuccess = true, Message = "Content removed and report actioned." };
        }
    }
}
