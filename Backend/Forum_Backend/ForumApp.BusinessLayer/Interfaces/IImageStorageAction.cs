namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IImageStorageAction
    {
        Task<string> SaveImageAsync(Stream stream, string fileName, string category, CancellationToken ct = default);
        void DeleteImageIfLocal(string? imageUrl);
    }
}
