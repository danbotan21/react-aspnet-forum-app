namespace ForumApp.Domain.Models.Ad
{
    // Public shape for a single sponsored ad card shown in the feed sidebar.
    // This is OUR contract — it is intentionally decoupled from whatever external
    // provider supplies the data, so the frontend never depends on a third-party shape.
    public class AdDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BrandLabel { get; set; } = string.Empty;
    }
}
