using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ForumApp.BusinessLayer.Structure
{
    public class LocalImageStorageService : IImageStorageActions
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp"
        };

        private const long MaxImageSizeBytes = 5 * 1024 * 1024;

        private readonly IWebHostEnvironment _environment;

        public LocalImageStorageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveImageAsync(IFormFile file, string category, CancellationToken ct = default)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("Missing image file.");

            if (file.Length > MaxImageSizeBytes)
                throw new InvalidOperationException("Image file is too large. Maximum allowed size is 5MB.");

            if (string.IsNullOrWhiteSpace(file.ContentType) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only image files are allowed.");

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
                throw new InvalidOperationException("Unsupported image format. Allowed: jpg, jpeg, png, gif, webp.");

            var safeCategory = SanitizeCategory(category);
            var webRootPath = GetWebRootPath();
            var uploadsDirPath = Path.Combine(webRootPath, "uploads", safeCategory);
            Directory.CreateDirectory(uploadsDirPath);

            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var fullFilePath = Path.Combine(uploadsDirPath, fileName);

            await using var stream = new FileStream(fullFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
            await file.CopyToAsync(stream, ct);

            return $"/uploads/{safeCategory}/{fileName}";
        }

        public void DeleteImageIfLocal(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return;

            var normalizedUrl = imageUrl.Trim();
            if (normalizedUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                normalizedUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                normalizedUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
                normalizedUrl.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (normalizedUrl.StartsWith("/"))
                normalizedUrl = normalizedUrl[1..];

            normalizedUrl = normalizedUrl.Replace('/', Path.DirectorySeparatorChar);

            if (!normalizedUrl.StartsWith($"uploads{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
                return;

            var uploadsRootPath = Path.GetFullPath(Path.Combine(GetWebRootPath(), "uploads"));
            var targetPath = Path.GetFullPath(Path.Combine(GetWebRootPath(), normalizedUrl));

            if (!targetPath.StartsWith(uploadsRootPath, StringComparison.OrdinalIgnoreCase))
                return;

            if (File.Exists(targetPath))
                File.Delete(targetPath);
        }

        private string SanitizeCategory(string? category)
        {
            if (string.IsNullOrWhiteSpace(category))
                return "misc";

            var cleaned = new string(category
                .ToLowerInvariant()
                .Where(ch => char.IsLetterOrDigit(ch) || ch == '-' || ch == '_')
                .ToArray());

            return string.IsNullOrWhiteSpace(cleaned) ? "misc" : cleaned;
        }

        private string GetWebRootPath()
        {
            if (!string.IsNullOrWhiteSpace(_environment.WebRootPath))
                return _environment.WebRootPath;

            var fallbackPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            Directory.CreateDirectory(fallbackPath);
            return fallbackPath;
        }
    }
}
