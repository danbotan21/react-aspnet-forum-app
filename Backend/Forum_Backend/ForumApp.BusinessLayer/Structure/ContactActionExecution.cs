using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Contact;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class ContactActionExecution : ContactActions, IContactAction
    {
        public ContactActionExecution(ForumDbContext context)
            : base(context) { }

        public Task<ActionResponse> SubmitContactFormAsync(ContactFormDto contactData, CancellationToken ct = default)
            => SubmitContactFormExecution(contactData, ct);

        public Task<IReadOnlyList<ContactReadDto>> GetAllMessagesAsync(CancellationToken ct = default)
            => GetAllMessagesExecution(ct);

        public Task<ActionResponse> DeleteMessageAsync(int id, CancellationToken ct = default)
            => DeleteMessageExecution(id, ct);
    }
}
