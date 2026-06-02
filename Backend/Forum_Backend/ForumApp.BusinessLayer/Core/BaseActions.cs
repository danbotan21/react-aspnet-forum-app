using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Entities.Vote;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public abstract class BaseActions
    {
        protected readonly ForumDbContext _context;

        protected BaseActions(ForumDbContext context)
        {
            _context = context;
        }

        protected Task<bool> IsGlobalAdminAsync(int userId, CancellationToken ct = default)
            => _context.Users.AnyAsync(u => u.Id == userId && u.Role == "Admin", ct);

        // The "supreme" admin is the first admin ever created (smallest user Id with the
        // Admin role). Only they may act on other admins (role, content removal, etc).
        protected async Task<bool> IsSupremeAdminAsync(int userId, CancellationToken ct = default)
        {
            var supremeId = await _context.Users
                .Where(u => u.Role == "Admin")
                .OrderBy(u => u.Id)
                .Select(u => (int?)u.Id)
                .FirstOrDefaultAsync(ct);
            return supremeId.HasValue && supremeId.Value == userId;
        }

        // True when a non-supreme admin tries to remove a FELLOW admin's content.
        // Only the supreme admin may moderate other admins. Non-admins (community
        // owners/moderators) are governed by their own role checks, so they're never
        // blocked here.
        protected async Task<bool> IsProtectedAdminContentAsync(int authorId, int requestingUserId, CancellationToken ct = default)
        {
            if (authorId == requestingUserId) return false; // your own content is fine
            var authorIsAdmin = await _context.Users.AnyAsync(u => u.Id == authorId && u.Role == "Admin", ct);
            if (!authorIsAdmin) return false;
            if (!await IsGlobalAdminAsync(requestingUserId, ct)) return false;
            return !await IsSupremeAdminAsync(requestingUserId, ct);
        }

        /// <summary>
        /// When voted-on content is deleted, undo the karma it gave its author.
        /// Karma only ever counted votes cast by OTHER users (self-votes were ignored
        /// in VoteActions), so we mirror that here. Does NOT call SaveChanges.
        /// </summary>
        private async Task ReverseKarmaForDeletedVotesAsync(
            IEnumerable<VoteData> votes,
            IReadOnlyDictionary<int, int> contentAuthorByTargetId,
            Func<VoteData, int?> targetIdSelector,
            CancellationToken ct)
        {
            var karmaByAuthor = new Dictionary<int, int>();
            foreach (var vote in votes)
            {
                var targetId = targetIdSelector(vote);
                if (targetId == null) continue;
                if (!contentAuthorByTargetId.TryGetValue(targetId.Value, out var authorId)) continue;
                if (vote.AuthorId == authorId) continue; // self-votes never affected karma
                karmaByAuthor[authorId] = karmaByAuthor.GetValueOrDefault(authorId) + (int)vote.Type;
            }

            if (karmaByAuthor.Count == 0) return;

            var authorIds = karmaByAuthor.Keys.ToList();
            var authors = await _context.Users.Where(u => authorIds.Contains(u.Id)).ToListAsync(ct);
            foreach (var author in authors)
                author.Karma -= karmaByAuthor[author.Id];
        }

        /// <summary>
        /// Removes the given comments together with their full reply tree and every
        /// row that depends on them (votes, saved items, notifications, reports).
        /// All comment relationships use DeleteBehavior.NoAction, so each child must
        /// be removed explicitly before its parent. Does NOT call SaveChanges — the
        /// caller batches the save into a single transaction.
        /// Returns the total number of comments scheduled for deletion.
        /// </summary>
        protected async Task<int> CascadeDeleteCommentsAsync(IEnumerable<int> commentIds, CancellationToken ct = default)
        {
            var ids = new HashSet<int>(commentIds);
            if (ids.Count == 0) return 0;

            // Walk the reply tree so nested replies are included (self-referencing FK is NoAction).
            var frontier = ids.ToList();
            while (frontier.Count > 0)
            {
                var children = await _context.Comments
                    .Where(c => c.ParentCommentId != null && frontier.Contains(c.ParentCommentId.Value))
                    .Select(c => c.Id)
                    .ToListAsync(ct);
                frontier = children.Where(id => ids.Add(id)).ToList();
            }

            var allIds = ids.ToList();

            var votes = await _context.Votes
                .Where(v => v.CommentId != null && allIds.Contains(v.CommentId.Value))
                .ToListAsync(ct);
            _context.Votes.RemoveRange(votes);

            var savedItems = await _context.SavedItems
                .Where(s => s.CommentId != null && allIds.Contains(s.CommentId.Value))
                .ToListAsync(ct);
            _context.SavedItems.RemoveRange(savedItems);

            var notifications = await _context.Notifications
                .Where(n => n.CommentId != null && allIds.Contains(n.CommentId.Value))
                .ToListAsync(ct);
            _context.Notifications.RemoveRange(notifications);

            var reports = await _context.Reports
                .Where(r => r.Type == ReportType.Comment && allIds.Contains(r.ReportedItemId))
                .ToListAsync(ct);
            _context.Reports.RemoveRange(reports);

            // Deepest replies first so the self-referencing FK is satisfied.
            var comments = await _context.Comments
                .Where(c => allIds.Contains(c.Id))
                .OrderByDescending(c => c.Id)
                .ToListAsync(ct);

            // Undo the karma these comments earned their authors before removing them.
            var commentAuthorById = comments.ToDictionary(c => c.Id, c => c.AuthorId);
            await ReverseKarmaForDeletedVotesAsync(votes, commentAuthorById, v => v.CommentId, ct);

            _context.Comments.RemoveRange(comments);

            return comments.Count;
        }

        /// <summary>
        /// Removes the given posts together with all of their comments (full reply
        /// trees) and every dependent row (votes, saved items, notifications,
        /// reports). Does NOT call SaveChanges.
        /// </summary>
        protected async Task CascadeDeletePostsAsync(IEnumerable<int> postIds, CancellationToken ct = default)
        {
            var ids = postIds.Distinct().ToList();
            if (ids.Count == 0) return;

            // Comments (and their reply trees + dependents) belonging to these posts.
            var commentIds = await _context.Comments
                .Where(c => ids.Contains(c.PostId))
                .Select(c => c.Id)
                .ToListAsync(ct);
            await CascadeDeleteCommentsAsync(commentIds, ct);

            var votes = await _context.Votes
                .Where(v => v.PostId != null && ids.Contains(v.PostId.Value))
                .ToListAsync(ct);
            _context.Votes.RemoveRange(votes);

            var savedItems = await _context.SavedItems
                .Where(s => s.PostId != null && ids.Contains(s.PostId.Value))
                .ToListAsync(ct);
            _context.SavedItems.RemoveRange(savedItems);

            var notifications = await _context.Notifications
                .Where(n => n.PostId != null && ids.Contains(n.PostId.Value))
                .ToListAsync(ct);
            _context.Notifications.RemoveRange(notifications);

            var reports = await _context.Reports
                .Where(r => r.Type == ReportType.Post && ids.Contains(r.ReportedItemId))
                .ToListAsync(ct);
            _context.Reports.RemoveRange(reports);

            var posts = await _context.Posts
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(ct);

            // Undo the karma these posts earned their authors before removing them.
            var postAuthorById = posts.ToDictionary(p => p.Id, p => p.AuthorId);
            await ReverseKarmaForDeletedVotesAsync(votes, postAuthorById, v => v.PostId, ct);

            _context.Posts.RemoveRange(posts);
        }
    }
}
