using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageStorageActions _imageStorageService;

        public ImagesController(IImageStorageActions imageStorageService)
        {
            _imageStorageService = imageStorageService;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] string category = "misc", CancellationToken ct = default)
        {
            if (file == null)
                return BadRequest(new { message = "No file was uploaded." });

            try
            {
                var imageUrl = await _imageStorageService.SaveImageAsync(file, category, ct);
                return Ok(new { imageUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
