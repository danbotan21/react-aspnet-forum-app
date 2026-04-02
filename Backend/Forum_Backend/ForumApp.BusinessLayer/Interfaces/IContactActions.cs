using ForumApp.Domain.Models.Contact;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IContactActions
    {
        Task<ActionResponse> SubmitContactFormAsync(ContactFormDto contactData, CancellationToken ct = default);
        Task<IReadOnlyList<ContactReadDto>> GetAllMessagesAsync(CancellationToken ct = default);
    }
}