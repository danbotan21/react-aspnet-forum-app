using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Contact;
using ForumApp.Domain.Models.Contact;
using ForumApp.Domain.Models.Responses;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class ContactService : IContactActions
    {
        private readonly ForumDbContext _context;

        // Constructor - Dependency Injection pentru DbContext -- Faradependency injection, sa avem 
        public ContactService(ForumDbContext context)
        {
             _context = context;
         }

        public async Task<ActionResponse> SubmitContactFormAsync(ContactFormDto n, CancellationToken ct = default)
        {
            try
            {
                // Validari de baza
                if (string.IsNullOrWhiteSpace(n.FullName) || n.FullName.Length < 2)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Full name must be at least 2 characters long."
                    };
                }

                if (string.IsNullOrWhiteSpace(n.Email) || !n.Email.Contains("@"))
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Please provide a valid email address."
                    };
                }

                if (string.IsNullOrWhiteSpace(n.Message) || n.Message.Length < 10)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Message must be at least 10 characters long."
                    };
                }

                // Optional: Anti-spam check (max 3 mesaje pe oră de la acelasi email)
                var recentMessagesCount = await _context.Contacts
                    .CountAsync(c => c.Email == n.Email && c.CreatedAt > DateTime.UtcNow.AddHours(-1), ct);

                if (recentMessagesCount >= 3)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "You have sent too many messages recently. Please try again later."
                    };
                }

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

                return new ActionResponse
                {
                    IsSuccess = true,
                    Message = "Your message has been sent successfully. We will get back to you soon."
                };   
            }
            catch(Exception ex)
            {
                // Logging la productie: log.Error(ex, "Failed to submit contact form");
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Failed to send contact message. Please try again later."
                };
            }
        }

        public async Task<IReadOnlyList<ContactReadDto>> GetAllMessagesAsync(CancellationToken ct = default)
        {
            try
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
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync(ct);

                return contacts;
            }
            catch(Exception ex)
            {
                // Logging la productie
                throw new Exception("Failed to retrieve contact messages.", ex);
            }
        }
 
    }
}