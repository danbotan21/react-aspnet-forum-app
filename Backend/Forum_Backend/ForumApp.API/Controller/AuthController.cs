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
        private readonly IUserAction _userService;
        private readonly IConfiguration _configuration;

        public AuthController(IUserAction userService, IConfiguration configuration)
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
            if (!result.IsSuccess)
                return BadRequest(new { message = result.Message });

            // No account is created yet — only a pending registration. The account is
            // materialized when the user confirms via the emailed link.
            return StatusCode(201, new { message = result.Message });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            LoginResponseDto? result;
            try
            {
                result = await _userService.LoginAsync(loginDto, ct);
            }
            catch (InvalidOperationException ex)
            {
                // Account is globally banned.
                return StatusCode(403, new { message = ex.Message });
            }

            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            // Account exists but its email was never confirmed → block and tell the client.
            if (result.RequiresEmailConfirmation)
                return StatusCode(403, new
                {
                    requiresEmailConfirmation = true,
                    email = result.PendingEmail,
                    message = "Please confirm your email first. Check your inbox for the confirmation link."
                });

            // Password OK → a login code was emailed; the client must verify it next.
            if (result.RequiresEmailCode)
                return Ok(new
                {
                    requiresCode = true,
                    email = result.PendingEmail,
                    message = "We sent a login code to your email."
                });

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("verify-login-code")]
        public async Task<IActionResult> VerifyLoginCode([FromBody] VerifyLoginCodeDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            LoginResponseDto? result;
            try
            {
                result = await _userService.VerifyLoginCodeAsync(dto.Email, dto.Code, ct);
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }

            if (result == null)
                return Unauthorized(new { message = "Invalid or expired code." });

            SetRefreshTokenCookie(result.RefreshToken);

            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var action = await _userService.ConfirmEmailAsync(dto.Token, ct);
            if (!action.IsSuccess)
                return BadRequest(new { message = action.Message });

            return Ok(new { message = action.Message });
        }

        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var action = await _userService.ResendConfirmationAsync(dto.Email, ct);
            return Ok(new { message = action.Message });
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

            LoginResponseDto? result;
            try
            {
                result = await _userService.GoogleLoginAsync(dto.AccessToken, ct);
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }

            if (result == null)
                return Unauthorized(new { message = "Invalid Google token." });

            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(new { token = result.Token, user = result.User });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(CancellationToken ct)
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
                await _userService.LogoutAsync(refreshToken, ct);

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

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Always returns a neutral success — never reveals whether the email exists.
            var action = await _userService.RequestPasswordResetAsync(dto.Email, ct);
            return Ok(new { message = action.Message });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var action = await _userService.ResetPasswordAsync(dto, ct);
            if (!action.IsSuccess)
                return BadRequest(new { message = action.Message });

            return Ok(new { message = action.Message });
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
