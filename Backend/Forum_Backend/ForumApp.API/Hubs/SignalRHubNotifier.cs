using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace ForumApp.API.Hubs
{
    public class SignalRHubNotifier : IHubNotifierAction
    {
        private readonly IHubContext<NotificationHub> _hub;

        public SignalRHubNotifier(IHubContext<NotificationHub> hub)
        {
            _hub = hub;
        }

        public async Task SendToUserAsync(int userId, string method, object payload, CancellationToken ct = default)
        {
            await _hub.Clients.User(userId.ToString()).SendAsync(method, payload, ct);
        }
    }
}
