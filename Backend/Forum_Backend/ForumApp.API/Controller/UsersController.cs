using ForumApp.BusinessLayer.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserActions _userService;

        public UsersController(IUserActions userService)
        {
            _userService = userService;
        }

        // GET api/users
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var users = await _userService.GetAllUsersAsync(ct);
            return Ok(users);
        }

        // GET api/users/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var user = await _userService.GetUserByIdAsync(id, ct);

            if (user == null)
                return NotFound($"User with ID {id} was not found.");

            return Ok(user);
        }

        // GET api/users/by-username/{username}
        [HttpGet("by-username/{username}")]
        public async Task<IActionResult> GetByUsername(string username, CancellationToken ct)
        {
            var user = await _userService.GetUserByUsernameAsync(username, ct);

            if (user == null)
                return NotFound($"User '{username}' was not found.");

            return Ok(user);
        }

        // GET api/users/search?term=dan
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string term, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(term))
                return BadRequest("Search term cannot be empty.");

            var users = await _userService.SearchUsersAsync(term, ct);
            return Ok(users);
        }
    }
}
