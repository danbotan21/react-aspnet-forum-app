using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.BusinessLayer.Structure
{
    public class ImageActionExecution : ImageActions, IImageAction
    {
        public void ValidateImageFile(string fileName, string contentType, long fileSize)
            => ValidateImageFileExecution(fileName, contentType, fileSize);
    }
}
