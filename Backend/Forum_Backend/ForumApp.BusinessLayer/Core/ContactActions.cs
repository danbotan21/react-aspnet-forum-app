using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Contact;
using ForumApp.Domain.Models.Contact;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class ContactActions
    {
        protected readonly ForumDbContext _context;

        public ContactActions(ForumDbContext context)
        {
            _context = context;
        }

        internal async Task<ActionResponse> SubmitContactFormExecution(ContactFormDto n, CancellationToken ct = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(n.FullName) || n.FullName.Length < 2)
                    return new ActionResponse { IsSuccess = false, Message = "Full name must be at least 2 characters long." };

                if (string.IsNullOrWhiteSpace(n.Email) || !n.Email.Contains("@"))
                    return new ActionResponse { IsSuccess = false, Message = "Please provide a valid email address." };

                if (string.IsNullOrWhiteSpace(n.Message) || n.Message.Length < 10)
                    return new ActionResponse { IsSuccess = false, Message = "Message must be at least 10 characters long." };

                var recentMessagesCount = await _context.Contacts
                    .CountAsync(c => c.Email == n.Email && c.CreatedAt > DateTime.UtcNow.AddHours(-1), ct);

                if (recentMessagesCount >= 3)
                    return new ActionResponse { IsSuccess = false, Message = "You have sent too many messages recently. Please try again later." };

                var contactMessage = new ContactData
                {
                    FullName = n.FullName,
                    Email = n.Email,
                    Subject = n.Subject,
                    Type = n.Type,
                    Message = n.Message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Contacts.Add(contactMessage);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse { IsSuccess = true, Message = "Your message has been sent successfully. We will get back to you soon." };
            }
            catch (Exception)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to send contact message. Please try again later." };
            }
        }

        internal async Task<IReadOnlyList<ContactReadDto>> GetAllMessagesExecution(CancellationToken ct = default)
        {
            var contacts = await _context.Contacts
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new ContactReadDto
                {
                    Id = n.Id,
                    FullName = n.FullName,
                    Email = n.Email,
                    Subject = n.Subject,
                    Type = n.Type,
                    Message = n.Message,
                    CreatedAt = n.CreatedAt,
                    AdminReply = n.AdminReply,
                    RepliedAt = n.RepliedAt
                })
                .ToListAsync(ct);

            return contacts;
        }

        internal async Task<ActionResponse> DeleteMessageExecution(int id, CancellationToken ct = default)
        {
            var message = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (message == null)
                return new ActionResponse { IsSuccess = false, Message = "Message not found." };

            _context.Contacts.Remove(message);
            try { await _context.SaveChangesAsync(ct); }
            catch { return new ActionResponse { IsSuccess = false, Message = "Failed to delete message." }; }

            return new ActionResponse { IsSuccess = true, Message = "Message deleted." };
        }
    }
}
