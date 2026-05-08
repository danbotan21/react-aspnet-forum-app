using Microsoft.AspNetCore.Mvc;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Contact;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IContactActions _contactService;

        public ContactController(IContactActions contactService)
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
        /// Get all contact messages (Admin only - add authorization later)
        /// </summary>
        /// <returns>List of all contact messages</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllMessages(CancellationToken ct = default)
        {
            try
            {
                var messages = await _contactService.GetAllMessagesAsync(ct);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                // Log error in production
                return StatusCode(500, new { message = "Failed to retrieve contact messages." });
            }
        }
    }
}
