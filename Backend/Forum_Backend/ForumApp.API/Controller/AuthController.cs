using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserActions _userService;
        private readonly IConfiguration _configuration;

        public AuthController(IUserActions userService, IConfiguration configuration)
        {
            _userService = userService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.RegisterAsync(registerDto, ct);
            if (result == null)
                return BadRequest(new { message = "Email or username already in use." });

            return StatusCode(201, result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.LoginAsync(loginDto, ct);
            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(CancellationToken ct)
        {
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new { message = "No refresh token. Please log in again." });

            var result = await _userService.RefreshTokenAsync(refreshToken, ct);
            if (result == null)
                return Unauthorized(new { message = "Refresh token invalid or expired. Please log in again." });

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.GoogleLoginAsync(dto.AccessToken, ct);
            if (result == null)
                return Unauthorized(new { message = "Invalid Google token." });

            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false
            });
            return Ok(new { message = "Logged out." });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile(CancellationToken ct)
        {
            int userId = GetCurrentUserId();
            var profile = await _userService.GetProfileAsync(userId, ct);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserUpdateDto updateDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetCurrentUserId();
            UserResponseDto? updated;
            try
            {
                updated = await _userService.UpdateProfileAsync(userId, updateDto, ct);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [Authorize]
        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetCurrentUserId();
            var action = await _userService.ChangePasswordAsync(userId, changePasswordDto, ct);
            if (!action.IsSuccess)
            {
                if (action.Message == "User not found.")
                    return NotFound(action.Message);

                return BadRequest(new { message = action.Message });
            }

            return Ok(action);
        }

        [Authorize]
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetCurrentUserId();
            var action = await _userService.DeleteAccountAsync(userId, dto, ct);
            if (!action.IsSuccess)
                return BadRequest(new { message = action.Message });

            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false
            });

            return Ok(action.Message);
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false, // Set true in production (requires HTTPS)
                Expires = DateTimeOffset.UtcNow.AddDays(expiryDays)
            });
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
