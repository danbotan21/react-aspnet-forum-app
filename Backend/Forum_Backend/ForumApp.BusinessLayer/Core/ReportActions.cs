using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class ReportActions : BaseActions
    {
        private readonly INotificationAction _notifications;

        public ReportActions(ForumDbContext context, INotificationAction notifications) : base(context)
        {
            _notifications = notifications;
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
                        .FirstOrDefaultAsync(c => c.Id == reportData.ReportedItemId, ct);
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
                .Where(c => commentIds.Contains(c.Id))
                .Include(c => c.Author)
                .ToDictionaryAsync(c => c.Id, ct);

            // Look up each content author's role in this community so the UI can flag the
            // owner's content and hide actions a moderator isn't allowed to take.
            var authorIds = posts.Values.Select(p => p.AuthorId)
                .Concat(comments.Values.Select(c => c.AuthorId))
                .Distinct()
                .ToList();
            var rolesByUserId = await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && authorIds.Contains(m.UserId))
                .ToDictionaryAsync(m => m.UserId, m => m.Role, ct);

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
                    ContentAuthorRole = rolesByUserId.GetValueOrDefault(post.AuthorId),
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
                    ContentAuthorRole = rolesByUserId.GetValueOrDefault(comment.AuthorId),
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

            // Resolve the reported content and its author up front — needed both for the
            // permission check and to notify the author afterwards.
            int? contentAuthorId = null;
            if (report.Type == ReportType.Post)
            {
                contentAuthorId = await _context.Posts
                    .Where(p => p.Id == report.ReportedItemId).Select(p => (int?)p.AuthorId).FirstOrDefaultAsync(ct);
            }
            else if (report.Type == ReportType.Comment)
            {
                contentAuthorId = await _context.Comments
                    .Where(c => c.Id == report.ReportedItemId).Select(c => (int?)c.AuthorId).FirstOrDefaultAsync(ct);
            }

            if (!isPrivileged && report.CommunityId.HasValue)
            {
                var isAdmin = await IsGlobalAdminAsync(requestingUserId, ct);
                var actorRole = await _context.CommunityMembers
                    .Where(m => m.CommunityId == report.CommunityId.Value && m.UserId == requestingUserId && !m.IsBanned)
                    .Select(m => m.Role)
                    .FirstOrDefaultAsync(ct);

                var canAct = isAdmin || actorRole == "owner" || actorRole == "moderator";
                if (!canAct) return new ActionResponse { IsSuccess = false, Message = "You don't have permission to remove content." };

                // A moderator must not be able to remove content posted by the owner or
                // by another moderator — only the owner (or a global admin) can do that.
                if (!isAdmin && actorRole == "moderator" && contentAuthorId.HasValue)
                {
                    var authorRole = await _context.CommunityMembers
                        .Where(m => m.CommunityId == report.CommunityId.Value && m.UserId == contentAuthorId.Value)
                        .Select(m => m.Role)
                        .FirstOrDefaultAsync(ct);
                    if (authorRole == "owner" || authorRole == "moderator")
                        return new ActionResponse { IsSuccess = false, Message = "Moderators cannot remove content posted by the owner or another moderator." };
                }
            }

            // A non-supreme admin may not remove a fellow admin's content via reports.
            if (contentAuthorId.HasValue && await IsProtectedAdminContentAsync(contentAuthorId.Value, requestingUserId, ct))
                return new ActionResponse { IsSuccess = false, Message = "Only the primary administrator can remove another administrator's content." };

            if (report.Type == ReportType.Post)
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == report.ReportedItemId, ct);
                if (post != null)
                {
                    await CascadeDeletePostsAsync(new[] { post.Id }, ct);
                }
            }
            else if (report.Type == ReportType.Comment)
            {
                var comment = await _context.Comments
                    .Include(c => c.Post)
                    .FirstOrDefaultAsync(c => c.Id == report.ReportedItemId, ct);

                if (comment != null)
                {
                    int removed = await CascadeDeleteCommentsAsync(new[] { comment.Id }, ct);

                    if (comment.Post != null && removed > 0)
                        comment.Post.CommentsCount = Math.Max(0, comment.Post.CommentsCount - removed);
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

            // Notify the content author that their post/comment was removed by a moderator.
            if (contentAuthorId.HasValue && contentAuthorId.Value != requestingUserId)
            {
                try
                {
                    var slug = report.CommunityId.HasValue
                        ? await _context.Communities.Where(c => c.Id == report.CommunityId.Value).Select(c => c.Slug).FirstOrDefaultAsync(ct)
                        : null;
                    var isPostType = report.Type == ReportType.Post;
                    await _notifications.CreateAndSendAsync(
                        contentAuthorId.Value,
                        isPostType ? NotificationType.PostDeletedByMod : NotificationType.CommentDeletedByMod,
                        isPostType ? "Your post was removed by a moderator." : "Your comment was removed by a moderator.",
                        requestingUserId,
                        null,
                        null,
                        slug,
                        null,
                        ct);
                }
                catch { }
            }

            return new ActionResponse { IsSuccess = true, Message = "Content removed and report actioned." };
        }
    }
}
