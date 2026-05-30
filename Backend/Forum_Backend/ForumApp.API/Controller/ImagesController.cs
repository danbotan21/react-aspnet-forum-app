using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    public class ImageUploadRequest
    {
        public IFormFile? File { get; set; }
        public string Category { get; set; } = "misc";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageAction _imageValidator;
        private readonly IImageStorageAction _imageStorageService;

        public ImagesController(IImageAction imageValidator, IImageStorageAction imageStorageService)
        {
            _imageValidator = imageValidator;
            _imageStorageService = imageStorageService;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromForm] ImageUploadRequest request, CancellationToken ct = default)
        {
            var file = request.File;
            if (file == null)
                return BadRequest(new { message = "No file was uploaded." });

            try
            {
                _imageValidator.ValidateImageFile(file.FileName, file.ContentType ?? "", file.Length);
                var imageUrl = await _imageStorageService.SaveImageAsync(file.OpenReadStream(), file.FileName, request.Category, ct);
                return Ok(new { imageUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
