using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Chat;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class ChatActionExecution : ChatActions, IChatAction
    {
        public ChatActionExecution(ForumDbContext context, IHubNotifierAction hubNotifier)
            : base(context, hubNotifier) { }

        public Task<IReadOnlyList<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default)
            => GetConversationsExecution(userId, ct);

        public Task<ConversationDto> GetOrCreateConversationAsync(int userId, int otherUserId, CancellationToken ct = default)
            => GetOrCreateConversationExecution(userId, otherUserId, ct);

        public Task<IReadOnlyList<MessageDto>> GetMessagesAsync(int userId, int conversationId, CancellationToken ct = default)
            => GetMessagesExecution(userId, conversationId, ct);

        public Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto, CancellationToken ct = default)
            => SendMessageExecution(senderId, dto, ct);

        public Task<MessageDto> EditMessageAsync(int userId, int messageId, string body, CancellationToken ct = default)
            => EditMessageExecution(userId, messageId, body, ct);

        public Task<ActionResponse> DeleteMessageAsync(int userId, int messageId, CancellationToken ct = default)
            => DeleteMessageExecution(userId, messageId, ct);

        public Task<ActionResponse> DeleteConversationAsync(int userId, int conversationId, CancellationToken ct = default)
            => DeleteConversationExecution(userId, conversationId, ct);

        public Task<ActionResponse> MarkConversationReadAsync(int userId, int conversationId, CancellationToken ct = default)
            => MarkConversationReadExecution(userId, conversationId, ct);

        public Task<int> GetTotalUnreadAsync(int userId, CancellationToken ct = default)
            => GetTotalUnreadExecution(userId, ct);
    }
}
