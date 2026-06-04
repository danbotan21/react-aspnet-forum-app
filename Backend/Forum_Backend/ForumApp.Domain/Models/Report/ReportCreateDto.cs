using System.ComponentModel.DataAnnotations;
using ForumApp.Domain.Entities.Report;

namespace ForumApp.Domain.Models.Report
{
    public class ReportCreateDto
    {
        public int ReporterId { get; set; }

        [Required]
        public ReportType Type { get; set; }

        [Range(1, int.MaxValue)]
        public int ReportedItemId { get; set; }

        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Reason { get; set; } = string.Empty;
    }
}
