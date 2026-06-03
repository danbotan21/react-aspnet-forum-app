using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    public class EditMessageRequest
    {
        public string? Body { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatAction _chatService;

        public ChatController(IChatAction chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations(CancellationToken ct)
            => Ok(await _chatService.GetConversationsAsync(GetCurrentUserId(), ct));

        // Open (or create) a 1-to-1 conversation with another user.
        [HttpPost("conversations/with/{userId:int}")]
        public async Task<IActionResult> StartConversation(int userId, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.GetOrCreateConversationAsync(GetCurrentUserId(), userId, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<IActionResult> GetMessages(int conversationId, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.GetMessagesAsync(GetCurrentUserId(), conversationId, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.SendMessageAsync(GetCurrentUserId(), dto, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("messages/{messageId:int}")]
        public async Task<IActionResult> EditMessage(int messageId, [FromBody] EditMessageRequest req, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.EditMessageAsync(GetCurrentUserId(), messageId, req?.Body ?? "", ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("messages/{messageId:int}")]
        public async Task<IActionResult> DeleteMessage(int messageId, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.DeleteMessageAsync(GetCurrentUserId(), messageId, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("conversations/{conversationId:int}")]
        public async Task<IActionResult> DeleteConversation(int conversationId, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.DeleteConversationAsync(GetCurrentUserId(), conversationId, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("conversations/{conversationId:int}/read")]
        public async Task<IActionResult> MarkRead(int conversationId, CancellationToken ct)
        {
            try
            {
                return Ok(await _chatService.MarkConversationReadAsync(GetCurrentUserId(), conversationId, ct));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount(CancellationToken ct)
            => Ok(new { count = await _chatService.GetTotalUnreadAsync(GetCurrentUserId(), ct) });

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
