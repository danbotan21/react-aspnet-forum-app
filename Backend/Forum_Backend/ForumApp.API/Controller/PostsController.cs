using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Post;
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


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PostCreateDto postData, [FromQuery] int authorId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _postService.CreatePostAsync(postData, authorId, ct);

            if (created == null)
                return BadRequest("Community not found, user is not a member, or post could not be saved.");

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT api/posts/{id}?requestingUserId=1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PostUpdateDto postData, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _postService.UpdatePostAsync(id, postData, requestingUserId, ct);

            if (updated == null)
                return NotFound("Post not found or you are not the author.");

            return Ok(updated);
        }

        // DELETE api/posts/{id}?requestingUserId=1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int requestingUserId, CancellationToken ct)
        {
            var result = await _postService.DeletePostAsync(id, requestingUserId, ct);

            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }
    }
}
