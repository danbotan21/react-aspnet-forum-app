using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Contact;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IContactAction _contactService;

        public ContactController(IContactAction contactService)
        {
            _contactService = contactService;
        }

        /// <summary>
        /// Submit a contact form message
        /// </summary>
        /// <param name="contactData">Contact form data</param>
        /// <returns>ActionResponse indicating success or failure</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SubmitContactForm([FromBody] ContactFormDto contactData, CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _contactService.SubmitContactFormAsync(contactData, ct);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get all contact messages (Admin only)
        /// </summary>
        /// <returns>List of all contact messages</returns>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllMessages(CancellationToken ct = default)
        {
            var messages = await _contactService.GetAllMessagesAsync(ct);
            return Ok(messages);
        }
    }
}
