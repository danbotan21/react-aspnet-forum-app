using Microsoft.AspNetCore.Http;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IImageStorageActions
    {
        Task<string> SaveImageAsync(IFormFile file, string category, CancellationToken ct = default);
        void DeleteImageIfLocal(string? imageUrl);
    }
}
