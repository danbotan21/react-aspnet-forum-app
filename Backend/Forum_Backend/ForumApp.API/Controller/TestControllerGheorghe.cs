using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

public class TestControllerGheorghe : ControllerBase
{
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok("Test successful!");
    }
}