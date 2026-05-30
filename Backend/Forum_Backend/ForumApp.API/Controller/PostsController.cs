using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Post;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostActions _postService;

        public PostsController(IPostActions postService)
        {
            _postService = postService;
        }

        // GET api/posts?sortBy=new&page=1&pageSize=15
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? sortBy, [FromQuery] int page = 1, [FromQuery] int pageSize = 15, CancellationToken ct = default)
        {
            var posts = await _postService.GetAllPostsAsync(sortBy, page, pageSize, ct);
            return Ok(posts);
        }

        // GET api/posts/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var post = await _postService.GetPostByIdAsync(id, ct);

            if (post == null)
                return NotFound($"Post with id {id} was not found.");

            return Ok(post);
        }

        // GET api/posts/community/{communityId}?sortBy=new&page=1&pageSize=15
        [HttpGet("community/{communityId:int}")]
        public async Task<IActionResult> GetByCommunity(int communityId, [FromQuery] string? sortBy, [FromQuery] int page = 1, [FromQuery] int pageSize = 15, CancellationToken ct = default)
        {
            var posts = await _postService.GetPostsByCommunityAsync(communityId, sortBy, page, pageSize, ct);
            return Ok(posts);
        }

        // GET api/posts/user/{userId}?page=1&pageSize=15
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 15, CancellationToken ct = default)
        {
            var posts = await _postService.GetPostsByUserAsync(userId, page, pageSize, ct);
            return Ok(posts);
        }

        // GET api/posts/search?term=amazing&limit=5
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string term, [FromQuery] int limit = 5, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(term))
                return BadRequest("Search term cannot be empty.");

            var posts = await _postService.SearchPostsAsync(term, Math.Min(limit, 20), ct);
            return Ok(posts);
        }

        // POST api/posts
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PostCreateDto postData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var authorId = GetCurrentUserId();
            var created = await _postService.CreatePostAsync(postData, authorId, ct);

            if (created == null)
                return BadRequest("Community not found, user is not a member, or post could not be saved.");

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT api/posts/{id}
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PostUpdateDto postData, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requestingUserId = GetCurrentUserId();
            var updated = await _postService.UpdatePostAsync(id, postData, requestingUserId, ct);

            if (updated == null)
                return NotFound("Post not found or you are not the author.");

            return Ok(updated);
        }

        // DELETE api/posts/{id}
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var requestingUserId = GetCurrentUserId();
            var result = await _postService.DeletePostAsync(id, requestingUserId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
