using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Chat;
using ForumApp.Domain.Models.Chat;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    // Direct-message logic. Real-time delivery is done by pushing a "ReceiveMessage"
    // event to the recipient through IHubNotifierAction (the existing SignalR hub).
    public class ChatActions
    {
        protected readonly ForumDbContext _context;
        protected readonly IHubNotifierAction _hubNotifier;

        public ChatActions(ForumDbContext context, IHubNotifierAction hubNotifier)
        {
            _context = context;
            _hubNotifier = hubNotifier;
        }

        internal async Task<IReadOnlyList<ConversationDto>> GetConversationsExecution(int userId, CancellationToken ct = default)
        {
            var conversations = await _context.Conversations
                .Where(c => c.User1Id == userId || c.User2Id == userId)
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync(ct);

            var result = new List<ConversationDto>(conversations.Count);
            foreach (var c in conversations)
            {
                var otherId = c.User1Id == userId ? c.User2Id : c.User1Id;
                var other = await GetUserBriefAsync(otherId, ct);

                var last = await _context.Messages
                    .Where(m => m.ConversationId == c.Id)
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => new { m.Body, m.ImageUrl, m.FileUrl })
                    .FirstOrDefaultAsync(ct);

                var unread = await _context.Messages
                    .CountAsync(m => m.ConversationId == c.Id && m.SenderId != userId && m.ReadAt == null, ct);

                result.Add(new ConversationDto
                {
                    Id = c.Id,
                    OtherUserId = otherId,
                    OtherUserName = other.UserName,
                    OtherUserAvatarUrl = other.AvatarUrl,
                    OtherUserIsPremium = other.IsPremium,
                    LastMessagePreview = FormatPreview(last?.Body, last?.ImageUrl, last?.FileUrl),
                    LastMessageAt = c.LastMessageAt,
                    UnreadCount = unread
                });
            }

            return result;
        }

        internal async Task<ConversationDto> GetOrCreateConversationExecution(int userId, int otherUserId, CancellationToken ct = default)
        {
            if (userId == otherUserId)
                throw new InvalidOperationException("You cannot start a conversation with yourself.");

            var otherExists = await _context.Users.AnyAsync(u => u.Id == otherUserId, ct);
            if (!otherExists)
                throw new InvalidOperationException("User not found.");

            var conversation = await FindOrCreateConversationAsync(userId, otherUserId, ct);

            var other = await GetUserBriefAsync(otherUserId, ct);
            var unread = await _context.Messages
                .CountAsync(m => m.ConversationId == conversation.Id && m.SenderId != userId && m.ReadAt == null, ct);
            var last = await _context.Messages
                .Where(m => m.ConversationId == conversation.Id)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new { m.Body, m.ImageUrl, m.FileUrl })
                .FirstOrDefaultAsync(ct);

            return new ConversationDto
            {
                Id = conversation.Id,
                OtherUserId = otherUserId,
                OtherUserName = other.UserName,
                OtherUserAvatarUrl = other.AvatarUrl,
                OtherUserIsPremium = other.IsPremium,
                LastMessagePreview = FormatPreview(last?.Body, last?.ImageUrl, last?.FileUrl),
                LastMessageAt = conversation.LastMessageAt,
                UnreadCount = unread
            };
        }

        internal async Task<IReadOnlyList<MessageDto>> GetMessagesExecution(int userId, int conversationId, CancellationToken ct = default)
        {
            await EnsureParticipantAsync(userId, conversationId, ct);

            // Load the most recent 100 messages, returned oldest-first for display.
            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(100)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderUserName = m.Sender.UserName,
                    SenderAvatarUrl = m.Sender.AvatarUrl,
                    Body = m.Body,
                    ImageUrl = m.ImageUrl,
                    FileUrl = m.FileUrl,
                    FileName = m.FileName,
                    CreatedAt = m.CreatedAt,
                    EditedAt = m.EditedAt,
                    ReadAt = m.ReadAt
                })
                .ToListAsync(ct);

            messages.Reverse();
            return messages;
        }

        internal async Task<MessageDto> SendMessageExecution(int senderId, SendMessageDto dto, CancellationToken ct = default)
        {
            var body = dto.Body?.Trim();
            var imageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim();
            var fileUrl = string.IsNullOrWhiteSpace(dto.FileUrl) ? null : dto.FileUrl.Trim();
            var fileName = string.IsNullOrWhiteSpace(dto.FileName) ? null : dto.FileName.Trim();

            if (string.IsNullOrWhiteSpace(body) && imageUrl == null && fileUrl == null)
                throw new InvalidOperationException("Message cannot be empty.");

            ConversationData conversation;
            if (dto.ConversationId.HasValue)
            {
                conversation = await EnsureParticipantAsync(senderId, dto.ConversationId.Value, ct);
            }
            else if (dto.RecipientId.HasValue)
            {
                if (dto.RecipientId.Value == senderId)
                    throw new InvalidOperationException("You cannot message yourself.");
                var exists = await _context.Users.AnyAsync(u => u.Id == dto.RecipientId.Value, ct);
                if (!exists) throw new InvalidOperationException("User not found.");
                conversation = await FindOrCreateConversationAsync(senderId, dto.RecipientId.Value, ct);
            }
            else
            {
                throw new InvalidOperationException("No conversation or recipient specified.");
            }

            var message = new MessageData
            {
                ConversationId = conversation.Id,
                SenderId = senderId,
                Body = body,
                ImageUrl = imageUrl,
                FileUrl = fileUrl,
                FileName = fileName,
                CreatedAt = DateTime.UtcNow
            };
            _context.Messages.Add(message);

            conversation.LastMessageAt = message.CreatedAt;
            await _context.SaveChangesAsync(ct);

            var sender = await GetUserBriefAsync(senderId, ct);
            var result = new MessageDto
            {
                Id = message.Id,
                ConversationId = conversation.Id,
                SenderId = senderId,
                SenderUserName = sender.UserName,
                SenderAvatarUrl = sender.AvatarUrl,
                Body = message.Body,
                ImageUrl = message.ImageUrl,
                FileUrl = message.FileUrl,
                FileName = message.FileName,
                CreatedAt = message.CreatedAt,
                EditedAt = null,
                ReadAt = null
            };

            // Push to the other participant in real time (non-critical if it fails).
            var recipientId = conversation.User1Id == senderId ? conversation.User2Id : conversation.User1Id;
            try
            {
                await _hubNotifier.SendToUserAsync(recipientId, "ReceiveMessage", result, ct);
            }
            catch
            {
                // already persisted; real-time delivery is best-effort
            }

            return result;
        }

        internal async Task<ActionResponse> MarkConversationReadExecution(int userId, int conversationId, CancellationToken ct = default)
        {
            var conversation = await EnsureParticipantAsync(userId, conversationId, ct);

            var affected = await _context.Messages
                .Where(m => m.ConversationId == conversationId && m.SenderId != userId && m.ReadAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, DateTime.UtcNow), ct);

            if (affected > 0)
            {
                // Tell the OTHER participant (the sender) that their messages were seen.
                var otherId = conversation.User1Id == userId ? conversation.User2Id : conversation.User1Id;
                try
                {
                    await _hubNotifier.SendToUserAsync(otherId, "MessagesRead",
                        new { conversationId, readerId = userId }, ct);
                }
                catch { /* best-effort */ }
            }

            return new ActionResponse { IsSuccess = true, Message = "Marked as read." };
        }

        internal async Task<MessageDto> EditMessageExecution(int userId, int messageId, string body, CancellationToken ct = default)
        {
            var trimmed = body?.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new InvalidOperationException("Message cannot be empty.");

            var message = await _context.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == messageId, ct);
            if (message == null)
                throw new InvalidOperationException("Message not found.");
            if (message.SenderId != userId)
                throw new InvalidOperationException("You can only edit your own messages.");

            message.Body = trimmed;
            message.EditedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            var dto = new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderUserName = message.Sender.UserName,
                SenderAvatarUrl = message.Sender.AvatarUrl,
                Body = message.Body,
                ImageUrl = message.ImageUrl,
                FileUrl = message.FileUrl,
                FileName = message.FileName,
                CreatedAt = message.CreatedAt,
                EditedAt = message.EditedAt,
                ReadAt = message.ReadAt
            };

            var conv = await _context.Conversations.FirstAsync(c => c.Id == message.ConversationId, ct);
            var otherId = conv.User1Id == userId ? conv.User2Id : conv.User1Id;
            try { await _hubNotifier.SendToUserAsync(otherId, "MessageEdited", dto, ct); } catch { }

            return dto;
        }

        internal async Task<ActionResponse> DeleteMessageExecution(int userId, int messageId, CancellationToken ct = default)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId, ct);
            if (message == null)
                return new ActionResponse { IsSuccess = true, Message = "Already deleted." };
            if (message.SenderId != userId)
                throw new InvalidOperationException("You can only delete your own messages.");

            var conversationId = message.ConversationId;
            var conv = await _context.Conversations.FirstAsync(c => c.Id == conversationId, ct);
            var otherId = conv.User1Id == userId ? conv.User2Id : conv.User1Id;

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync(ct);

            try
            {
                await _hubNotifier.SendToUserAsync(otherId, "MessageDeleted",
                    new { conversationId, messageId }, ct);
            }
            catch { }

            return new ActionResponse { IsSuccess = true, Message = "Message deleted." };
        }

        internal async Task<ActionResponse> DeleteConversationExecution(int userId, int conversationId, CancellationToken ct = default)
        {
            var conversation = await EnsureParticipantAsync(userId, conversationId, ct);
            var otherId = conversation.User1Id == userId ? conversation.User2Id : conversation.User1Id;

            // Messages are removed via the cascade FK on the conversation.
            _context.Conversations.Remove(conversation);
            await _context.SaveChangesAsync(ct);

            try
            {
                await _hubNotifier.SendToUserAsync(otherId, "ConversationDeleted",
                    new { conversationId }, ct);
            }
            catch { }

            return new ActionResponse { IsSuccess = true, Message = "Conversation deleted." };
        }

        internal async Task<int> GetTotalUnreadExecution(int userId, CancellationToken ct = default)
        {
            return await _context.Messages
                .CountAsync(m => m.ReadAt == null && m.SenderId != userId &&
                    (m.Conversation.User1Id == userId || m.Conversation.User2Id == userId), ct);
        }

        private static string? FormatPreview(string? body, string? imageUrl, string? fileUrl)
        {
            if (!string.IsNullOrWhiteSpace(body)) return body;
            if (imageUrl != null) return "📷 Photo";
            if (fileUrl != null) return "📎 File";
            return null;
        }

        // ---- helpers ----

        // Conversations always store the smaller user id as User1 so the unique pair index works.
        private async Task<ConversationData> FindOrCreateConversationAsync(int a, int b, CancellationToken ct)
        {
            var u1 = Math.Min(a, b);
            var u2 = Math.Max(a, b);

            var existing = await _context.Conversations
                .FirstOrDefaultAsync(c => c.User1Id == u1 && c.User2Id == u2, ct);
            if (existing != null) return existing;

            var conversation = new ConversationData
            {
                User1Id = u1,
                User2Id = u2,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync(ct);
            return conversation;
        }

        private async Task<ConversationData> EnsureParticipantAsync(int userId, int conversationId, CancellationToken ct)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId, ct);
            if (conversation == null)
                throw new InvalidOperationException("Conversation not found.");
            if (conversation.User1Id != userId && conversation.User2Id != userId)
                throw new InvalidOperationException("You are not part of this conversation.");
            return conversation;
        }

        private async Task<UserBrief> GetUserBriefAsync(int userId, CancellationToken ct)
        {
            var now = DateTime.UtcNow;
            var u = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => new UserBrief
                {
                    UserName = x.UserName,
                    AvatarUrl = x.AvatarUrl,
                    IsPremium = x.PremiumUntil.HasValue && x.PremiumUntil.Value > now
                })
                .FirstOrDefaultAsync(ct);

            return u ?? new UserBrief { UserName = "[deleted]" };
        }

        private sealed class UserBrief
        {
            public string UserName { get; set; } = string.Empty;
            public string? AvatarUrl { get; set; }
            public bool IsPremium { get; set; }
        }
    }
}
