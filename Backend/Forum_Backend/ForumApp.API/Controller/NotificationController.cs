using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using System.Security.Claims;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/notification")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationAction _notificationService;

        public NotificationController(INotificationAction notificationService)
        {
            _notificationService = notificationService;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, ct);
            return Ok(notifications);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId, ct);
            return Ok(new { count });
        }

        [HttpPut("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _notificationService.MarkAsReadAsync(id, userId, ct);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPut("mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _notificationService.MarkAllAsReadAsync(userId, ct);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _notificationService.DeleteNotificationAsync(id, userId, ct);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }
    }
}
