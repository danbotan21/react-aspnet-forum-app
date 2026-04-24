using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationActions _notificationService;

        public NotificationController(INotificationActions notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Get all notifications for a specific user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>List of user notifications</returns>
        [HttpGet("user/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetUserNotifications(int userId, CancellationToken ct = default)
        {
            // TODO: Add authorization to ensure user can only see their own notifications
            // if (userId != GetCurrentUserId()) return Forbid();

            try
            {
                var notifications = await _notificationService.GetUserNotificationsAsync(userId, ct);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                // Log error in production
                return StatusCode(500, new { message = "Failed to retrieve notifications." });
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        /// <param name="id">Notification ID</param>
        /// <param name="userId">User ID (for authorization)</param>
        /// <returns>ActionResponse indicating success or failure</returns>
        [HttpPut("{id}/mark-as-read")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> MarkAsRead(int id, [FromQuery] int userId, CancellationToken ct = default)
        {
            // TODO: Get userId from authentication context when auth is implemented
            // int userId = GetCurrentUserId();

            var result = await _notificationService.MarkAsReadAsync(id, userId, ct);

            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        /// <param name="id">Notification ID</param>
        /// <param name="userId">User ID (for authorization)</param>
        /// <returns>ActionResponse indicating success or failure</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteNotification(int id, [FromQuery] int userId, CancellationToken ct = default)
        {
            // TODO: Get userId from authentication context when auth is implemented
            // int userId = GetCurrentUserId();

            var result = await _notificationService.DeleteNotificationAsync(id, userId, ct);

            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
    }
}
