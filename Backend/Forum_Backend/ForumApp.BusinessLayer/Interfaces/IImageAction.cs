namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IImageAction
    {
        void ValidateImageFile(string fileName, string contentType, long fileSize);
    }
}
