using ForumApp.Domain.Entities.Contact;

namespace ForumApp.Domain.Models.Contact
{
    public class ContactFormDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public ContactType Type { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}