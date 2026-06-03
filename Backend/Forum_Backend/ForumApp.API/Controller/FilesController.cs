using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    public class FileUploadRequest
    {
        public IFormFile? File { get; set; }
        public string Category { get; set; } = "messages";
    }

    // Generic file upload (any type) — reuses the same local storage as images.
    // Used for chat attachments that are not images.
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IImageStorageAction _storageService;

        public FilesController(IImageStorageAction storageService)
        {
            _storageService = storageService;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromForm] FileUploadRequest request, CancellationToken ct = default)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file was uploaded." });

            try
            {
                var fileUrl = await _storageService.SaveImageAsync(
                    file.OpenReadStream(), file.FileName, request.Category, ct);
                return Ok(new { fileUrl, fileName = file.FileName });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
