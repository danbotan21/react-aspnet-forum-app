using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IReportActions
    {
        Task<ActionResponse> CreateReportAsync(ReportCreateDto reportData, int reporterId, CancellationToken ct = default);
        Task<IReadOnlyList<ReportResponseDto>> GetAllReportsAsync(CancellationToken ct = default);
        Task<ActionResponse> DeleteReportAsync(int reportId, CancellationToken ct = default);
    }

}