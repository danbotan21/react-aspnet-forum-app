using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace ForumApp.API.Infrastructure
{
    public class LocalImageStorageService : IImageStorageAction
    {
        private readonly IWebHostEnvironment _environment;

        public LocalImageStorageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        private string GetWebRootPath()
        {
            if (!string.IsNullOrWhiteSpace(_environment.WebRootPath))
                return _environment.WebRootPath;

            var fallbackPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            Directory.CreateDirectory(fallbackPath);
            return fallbackPath;
        }

        private static string SanitizeCategory(string? category)
        {
            if (string.IsNullOrWhiteSpace(category))
                return "misc";

            var cleaned = new string(category
                .ToLowerInvariant()
                .Where(ch => char.IsLetterOrDigit(ch) || ch == '-' || ch == '_')
                .ToArray());

            return string.IsNullOrWhiteSpace(cleaned) ? "misc" : cleaned;
        }

        public async Task<string> SaveImageAsync(Stream stream, string fileName, string category, CancellationToken ct = default)
        {
            var safeCategory = SanitizeCategory(category);
            var webRootPath = GetWebRootPath();
            var uploadsDirPath = Path.Combine(webRootPath, "uploads", safeCategory);
            Directory.CreateDirectory(uploadsDirPath);

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var generatedFileName = $"{Guid.NewGuid():N}{extension}";
            var fullFilePath = Path.Combine(uploadsDirPath, generatedFileName);

            await using var fileStream = new FileStream(fullFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
            await stream.CopyToAsync(fileStream, ct);

            return $"/uploads/{safeCategory}/{generatedFileName}";
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
                return;

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
    }
}
