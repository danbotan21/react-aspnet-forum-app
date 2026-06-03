using ForumApp.Domain.Models.Chat;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IChatAction
    {
        Task<IReadOnlyList<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default);
        Task<ConversationDto> GetOrCreateConversationAsync(int userId, int otherUserId, CancellationToken ct = default);
        Task<IReadOnlyList<MessageDto>> GetMessagesAsync(int userId, int conversationId, CancellationToken ct = default);
        Task<MessageDto> SendMessageAsync(int senderId, SendMessageDto dto, CancellationToken ct = default);
        Task<MessageDto> EditMessageAsync(int userId, int messageId, string body, CancellationToken ct = default);
        Task<ActionResponse> DeleteMessageAsync(int userId, int messageId, CancellationToken ct = default);
        Task<ActionResponse> DeleteConversationAsync(int userId, int conversationId, CancellationToken ct = default);
        Task<ActionResponse> MarkConversationReadAsync(int userId, int conversationId, CancellationToken ct = default);
        Task<int> GetTotalUnreadAsync(int userId, CancellationToken ct = default);
    }
}
