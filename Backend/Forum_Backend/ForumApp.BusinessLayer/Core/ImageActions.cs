namespace ForumApp.BusinessLayer.Core
{
    public class ImageActions
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
        };

        private const long MaxImageSizeBytes = 5 * 1024 * 1024;

        internal void ValidateImageFileExecution(string fileName, string contentType, long fileSize)
        {
            if (fileSize == 0)
                throw new InvalidOperationException("Missing image file.");

            if (fileSize > MaxImageSizeBytes)
                throw new InvalidOperationException("Image file is too large. Maximum allowed size is 5MB.");

            if (string.IsNullOrWhiteSpace(contentType) || !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only image files are allowed.");

            var extension = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
                throw new InvalidOperationException("Unsupported image format. Allowed: jpg, jpeg, png, gif, webp.");
        }
    }
}
