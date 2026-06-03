using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ForumApp.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // Forwards a transient "typing" signal to the other participant of a conversation.
        // Not persisted — purely a live UI hint.
        public Task SendTyping(int otherUserId, int conversationId)
        {
            var fromUserId = Context.UserIdentifier;
            return Clients.User(otherUserId.ToString())
                .SendAsync("Typing", new { conversationId, fromUserId });
        }
    }
}
