using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.AdminLog;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Admin;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class AdminActions
    {
        protected readonly ForumDbContext _context;
        protected readonly INotificationAction _notifications;

        // Valid global roles. Kept here so the admin panel and authorization stay in sync.
        private static readonly string[] ValidRoles = { "Admin", "User" };

        public AdminActions(ForumDbContext context, INotificationAction notifications)
        {
            _context = context;
            _notifications = notifications;
        }

        // ─── STATS ───────────────────────────────────────────────────────────────

        internal async Task<AdminStatsDto> GetStatsExecution(CancellationToken ct = default)
        {
            return new AdminStatsDto
            {
                TotalUsers = await _context.Users.CountAsync(ct),
                TotalCommunities = await _context.Communities.CountAsync(ct),
                TotalPosts = await _context.Posts.CountAsync(ct),
                TotalComments = await _context.Comments.CountAsync(ct),
                PendingReports = await _context.Reports.CountAsync(r => r.Status == "pending", ct),
                BannedUsers = await _context.Users.CountAsync(u => u.IsBanned, ct),
            };
        }

        // ─── USERS ─────────────────────────────────────────────────────────────────

        internal async Task<IReadOnlyList<AdminUserDto>> GetUsersExecution(string? search = null, CancellationToken ct = default)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u => u.UserName.Contains(term) || u.Email.Contains(term));
            }

            var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync(ct);
            var userIds = users.Select(u => u.ID).ToList();

            // Activity counts in a single grouped query each (avoids N+1).
            var postCounts = await _context.Posts
                .Where(p => userIds.Contains(p.AuthorId))
                .GroupBy(p => p.AuthorId)
                .Select(g => new { AuthorId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.AuthorId, x => x.Count, ct);

            var commentCounts = await _context.Comments
                .Where(c => userIds.Contains(c.AuthorId))
                .GroupBy(c => c.AuthorId)
                .Select(g => new { AuthorId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.AuthorId, x => x.Count, ct);

            var communityCounts = await _context.CommunityMembers
                .Where(m => userIds.Contains(m.UserId))
                .GroupBy(m => m.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

            return users.Select(u => new AdminUserDto
            {
                Id = u.ID,
                UserName = u.UserName,
                Email = u.Email,
                Bio = u.Bio,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role,
                Karma = u.Karma,
                CreatedAt = u.CreatedAt,
                IsBanned = u.IsBanned,
                BanReason = u.BanReason,
                BannedAt = u.BannedAt,
                PostsCount = postCounts.GetValueOrDefault(u.ID, 0),
                CommentsCount = commentCounts.GetValueOrDefault(u.ID, 0),
                CommunitiesCount = communityCounts.GetValueOrDefault(u.ID, 0),
            }).ToList();
        }

        internal async Task<ActionResponse> BanUserExecution(int targetUserId, string reason, int adminUserId, CancellationToken ct = default)
        {
            if (targetUserId == adminUserId)
                return new ActionResponse { IsSuccess = false, Message = "You cannot ban yourself." };

            if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 3)
                return new ActionResponse { IsSuccess = false, Message = "Please provide a ban reason." };

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == targetUserId, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (user.Role == "Admin")
                return new ActionResponse { IsSuccess = false, Message = "You cannot ban another administrator. Remove their admin role first." };

            user.IsBanned = true;
            user.BanReason = reason.Trim();
            user.BannedAt = DateTime.UtcNow;
            user.BannedByUserId = adminUserId;
            // Kill any active session immediately.
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            AddLog(adminUserId, "ban", "user", user.ID, $"u/{user.UserName}", reason.Trim());

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to ban user." }; }

            return new ActionResponse { IsSuccess = true, Message = $"User u/{user.UserName} has been banned." };
        }

        internal async Task<ActionResponse> UnbanUserExecution(int targetUserId, int adminUserId, CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == targetUserId, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (!user.IsBanned)
                return new ActionResponse { IsSuccess = false, Message = "User is not banned." };

            user.IsBanned = false;
            user.BanReason = null;
            user.BannedAt = null;
            user.BannedByUserId = null;

            AddLog(adminUserId, "unban", "user", user.ID, $"u/{user.UserName}", null);

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to unban user." }; }

            return new ActionResponse { IsSuccess = true, Message = $"User u/{user.UserName} has been unbanned." };
        }

        internal async Task<ActionResponse> ChangeUserRoleExecution(int targetUserId, string role, int adminUserId, CancellationToken ct = default)
        {
            if (!ValidRoles.Contains(role))
                return new ActionResponse { IsSuccess = false, Message = "Invalid role. Allowed values: Admin, User." };

            if (targetUserId == adminUserId && role != "Admin")
                return new ActionResponse { IsSuccess = false, Message = "You cannot remove your own admin role." };

            var user = await _context.Users.FirstOrDefaultAsync(u => u.ID == targetUserId, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (user.IsBanned && role == "Admin")
                return new ActionResponse { IsSuccess = false, Message = "Unban the user before promoting them to admin." };

            user.Role = role;

            AddLog(adminUserId, "role", "user", user.ID, $"u/{user.UserName}", $"role set to {role}");

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to change user role." }; }

            return new ActionResponse { IsSuccess = true, Message = $"u/{user.UserName} is now {role}." };
        }

        // ─── COMMUNITIES ─────────────────────────────────────────────────────────────

        internal async Task<IReadOnlyList<AdminCommunityDto>> GetCommunitiesExecution(CancellationToken ct = default)
        {
            var communities = await _context.Communities
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(ct);
            var ids = communities.Select(c => c.Id).ToList();

            var postCounts = await _context.Posts
                .Where(p => ids.Contains(p.CommunityId))
                .GroupBy(p => p.CommunityId)
                .Select(g => new { CommunityId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CommunityId, x => x.Count, ct);

            var memberCounts = await _context.CommunityMembers
                .Where(m => ids.Contains(m.CommunityId) && !m.IsBanned)
                .GroupBy(m => m.CommunityId)
                .Select(g => new { CommunityId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CommunityId, x => x.Count, ct);

            var owners = await _context.CommunityMembers
                .Where(m => ids.Contains(m.CommunityId) && m.Role == "owner")
                .Include(m => m.User)
                .ToListAsync(ct);
            var ownerByCommunity = owners
                .GroupBy(m => m.CommunityId)
                .ToDictionary(g => g.Key, g => g.First().User?.UserName);

            return communities.Select(c => new AdminCommunityDto
            {
                Id = c.Id,
                Slug = c.Slug,
                Title = c.Title,
                Category = c.Category,
                Type = c.Type,
                AvatarUrl = c.AvatarUrl,
                CreatedAt = c.CreatedAt,
                OwnerUserName = ownerByCommunity.GetValueOrDefault(c.Id),
                MembersCount = memberCounts.GetValueOrDefault(c.Id, 0),
                PostsCount = postCounts.GetValueOrDefault(c.Id, 0),
            }).ToList();
        }

        // ─── REPORTS (all communities) ─────────────────────────────────────────────

        internal async Task<IReadOnlyList<AdminReportDto>> GetReportsExecution(string? status = null, CancellationToken ct = default)
        {
            var query = _context.Reports.Include(r => r.Reporter).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status) && status != "all")
                query = query.Where(r => r.Status == status);

            var reports = await query.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);

            // Pre-load referenced content so we can build previews without N+1.
            var postIds = reports.Where(r => r.Type == ReportType.Post).Select(r => r.ReportedItemId).Distinct().ToList();
            var commentIds = reports.Where(r => r.Type == ReportType.Comment).Select(r => r.ReportedItemId).Distinct().ToList();
            var reportedUserIds = reports.Where(r => r.Type == ReportType.User).Select(r => r.ReportedItemId).Distinct().ToList();

            var posts = await _context.Posts.Where(p => postIds.Contains(p.Id))
                .Include(p => p.Author).ToDictionaryAsync(p => p.Id, ct);
            var comments = await _context.Comments.Where(c => commentIds.Contains(c.ID))
                .Include(c => c.Author).ToDictionaryAsync(c => c.ID, ct);
            var reportedUsers = await _context.Users.Where(u => reportedUserIds.Contains(u.ID))
                .ToDictionaryAsync(u => u.ID, u => u.UserName, ct);

            var communityIds = reports.Where(r => r.CommunityId.HasValue).Select(r => r.CommunityId!.Value).Distinct().ToList();
            var communities = await _context.Communities.Where(c => communityIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => new { c.Title, c.Slug }, ct);

            string? Preview(string? body) =>
                body != null && body.Length > 300 ? body.Substring(0, 300) + "..." : body;

            var result = new List<AdminReportDto>();
            foreach (var r in reports)
            {
                var dto = new AdminReportDto
                {
                    Id = r.Id,
                    Reason = r.Reason,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    ReporterUserName = r.Reporter?.UserName ?? "[deleted]",
                    ReportedItemId = r.ReportedItemId,
                    CommunityId = r.CommunityId,
                    CommunityName = r.CommunityId.HasValue && communities.TryGetValue(r.CommunityId.Value, out var c1) ? c1.Title : null,
                    CommunitySlug = r.CommunityId.HasValue && communities.TryGetValue(r.CommunityId.Value, out var c2) ? c2.Slug : null,
                };

                if (r.Type == ReportType.Post && posts.TryGetValue(r.ReportedItemId, out var post))
                {
                    dto.TypeName = "Post";
                    dto.PostTitle = post.Title;
                    dto.PostId = post.Id;
                    dto.ContentPreview = Preview(post.Body);
                    dto.ContentAuthorUserName = post.Author?.UserName;
                }
                else if (r.Type == ReportType.Comment && comments.TryGetValue(r.ReportedItemId, out var comment))
                {
                    dto.TypeName = "Comment";
                    dto.PostId = comment.PostId;
                    dto.ContentPreview = Preview(comment.Body);
                    dto.ContentAuthorUserName = comment.Author?.UserName;
                }
                else if (r.Type == ReportType.User)
                {
                    dto.TypeName = "User";
                    dto.ContentAuthorUserName = reportedUsers.GetValueOrDefault(r.ReportedItemId);
                }
                else
                {
                    // Content was already deleted — keep the report visible but flag it.
                    dto.TypeName = r.Type.ToString();
                    dto.ContentPreview = "[content no longer exists]";
                }

                result.Add(dto);
            }

            return result;
        }

        // ─── CONTENT BROWSER ─────────────────────────────────────────────────────────

        internal async Task<AdminPagedResult<AdminPostDto>> GetPostsExecution(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.Posts.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p => p.Title.Contains(term) || (p.Body != null && p.Body.Contains(term)));
            }

            var total = await query.CountAsync(ct);

            var posts = await query
                .Include(p => p.Author)
                .Include(p => p.Community)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var items = posts.Select(p => new AdminPostDto
            {
                Id = p.Id,
                Title = p.Title,
                Preview = p.Body != null && p.Body.Length > 200 ? p.Body.Substring(0, 200) + "..." : p.Body,
                Type = p.Type,
                Votes = p.Votes,
                CommentsCount = p.CommentsCount,
                CreatedAt = p.CreatedAt,
                AuthorUserName = p.Author?.UserName ?? "[deleted]",
                CommunitySlug = p.Community?.Slug,
                CommunityTitle = p.Community?.Title,
            }).ToList();

            return new AdminPagedResult<AdminPostDto> { Items = items, Total = total, Page = page, PageSize = pageSize };
        }

        internal async Task<AdminPagedResult<AdminCommentDto>> GetCommentsExecution(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.Comments.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(c => c.Body.Contains(term));
            }

            var total = await query.CountAsync(ct);

            var comments = await query
                .Include(c => c.Author)
                .Include(c => c.Post).ThenInclude(p => p.Community)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var items = comments.Select(c => new AdminCommentDto
            {
                Id = c.ID,
                Preview = c.Body.Length > 200 ? c.Body.Substring(0, 200) + "..." : c.Body,
                Votes = c.Votes,
                CreatedAt = c.CreatedAt,
                AuthorUserName = c.Author?.UserName ?? "[deleted]",
                PostId = c.PostId,
                PostTitle = c.Post?.Title,
                CommunitySlug = c.Post?.Community?.Slug,
            }).ToList();

            return new AdminPagedResult<AdminCommentDto> { Items = items, Total = total, Page = page, PageSize = pageSize };
        }

        // ─── AUDIT LOG ───────────────────────────────────────────────────────────────

        // Queues a log row on the context (caller is responsible for SaveChanges).
        private void AddLog(int actorId, string actionType, string? targetType, int? targetId, string? targetLabel, string? details)
        {
            _context.AdminLogs.Add(new AdminLogData
            {
                ActorId = actorId,
                ActionType = actionType,
                TargetType = targetType,
                TargetId = targetId,
                TargetLabel = targetLabel,
                Details = details,
                CreatedAt = DateTime.UtcNow,
            });
        }

        // Persists a single log entry immediately (used for actions performed by other services).
        internal async Task LogActionExecution(int actorId, string actionType, string? targetType, int? targetId, string? targetLabel, string? details, CancellationToken ct = default)
        {
            AddLog(actorId, actionType, targetType, targetId, targetLabel, details);
            try { await _context.SaveChangesAsync(ct); } catch { /* logging must never break the request */ }
        }

        // ─── MESSAGE REPLY ───────────────────────────────────────────────────────────

        internal async Task<ActionResponse> ReplyToMessageExecution(int messageId, string reply, int adminUserId, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(reply) || reply.Trim().Length < 2)
                return new ActionResponse { IsSuccess = false, Message = "Reply cannot be empty." };

            reply = reply.Trim();
            if (reply.Length > 1000) reply = reply.Substring(0, 1000);

            var message = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == messageId, ct);
            if (message == null)
                return new ActionResponse { IsSuccess = false, Message = "Message not found." };

            message.AdminReply = reply;
            message.RepliedAt = DateTime.UtcNow;
            message.RepliedByUserId = adminUserId;

            AddLog(adminUserId, "reply_message", "message", message.Id, $"to {message.Email}", null);

            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to save reply." }; }

            // If the sender is a registered user, notify them in-app (and over SignalR).
            var recipient = await _context.Users.FirstOrDefaultAsync(u => u.Email == message.Email, ct);
            if (recipient != null)
            {
                var notifText = $"An admin replied to your message \"{message.Subject}\": {reply}";
                if (notifText.Length > 300) notifText = notifText.Substring(0, 297) + "...";
                try
                {
                    await _notifications.CreateAndSendAsync(recipient.ID, NotificationType.ContactReply, notifText, adminUserId, ct: ct);
                }
                catch { /* notification failure must not fail the reply */ }

                return new ActionResponse { IsSuccess = true, Message = $"Reply sent to u/{recipient.UserName} (in-app notification)." };
            }

            return new ActionResponse { IsSuccess = true, Message = "Reply saved. The sender has no account — contact them by email." };
        }

        internal async Task<IReadOnlyList<AdminLogDto>> GetLogsExecution(int limit = 100, CancellationToken ct = default)
        {
            if (limit < 1 || limit > 500) limit = 100;
            return await _context.AdminLogs
                .Include(l => l.Actor)
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .Select(l => new AdminLogDto
                {
                    Id = l.Id,
                    ActionType = l.ActionType,
                    ActorUserName = l.Actor != null ? l.Actor.UserName : "[deleted]",
                    TargetType = l.TargetType,
                    TargetId = l.TargetId,
                    TargetLabel = l.TargetLabel,
                    Details = l.Details,
                    CreatedAt = l.CreatedAt,
                })
                .ToListAsync(ct);
        }
    }
}
