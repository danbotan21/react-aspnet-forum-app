using ForumApp.Domain.Entities.Report;

namespace ForumApp.Domain.Models.Report
{
    public class ReportResponseDto
    {
        public int ReporterId { get; set; }
        public ReportType Type { get; set; }
        public int ReportedItemId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}