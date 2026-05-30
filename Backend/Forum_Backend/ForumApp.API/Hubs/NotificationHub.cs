using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ForumApp.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub { }
}
