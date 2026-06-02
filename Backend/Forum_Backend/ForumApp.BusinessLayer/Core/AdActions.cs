using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.Ad;

namespace ForumApp.BusinessLayer.Core
{

    public class AdActions
    {
        private readonly IAdProviderAction _provider;

        private static readonly SemaphoreSlim _refreshLock = new(1, 1);
        private static List<AdDto>? _cachedAds;
        private static DateTime _cacheExpiresAtUtc = DateTime.MinValue;
        private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

        public AdActions(IAdProviderAction provider)
        {
            _provider = provider;
        }

        internal async Task<IReadOnlyList<AdDto>> GetAdsForFeedExecution(int count, CancellationToken ct = default)
        {
            if (count <= 0) count = 3;

            var inventory = await GetInventoryAsync(ct);
            if (inventory.Count == 0)
                return Array.Empty<AdDto>();

            // Pick `count` random ads from the cached inventory so the rail varies per load.
            return inventory
                .OrderBy(_ => Guid.NewGuid())
                .Take(Math.Min(count, inventory.Count))
                .ToList();
        }

        private async Task<List<AdDto>> GetInventoryAsync(CancellationToken ct)
        {
            if (_cachedAds is not null && DateTime.UtcNow < _cacheExpiresAtUtc)
                return _cachedAds;

            await _refreshLock.WaitAsync(ct);
            try
            {
                // Re-check after acquiring the lock: another request may have just refreshed it.
                if (_cachedAds is not null && DateTime.UtcNow < _cacheExpiresAtUtc)
                    return _cachedAds;

                IReadOnlyList<AdDto> fetched;
                try
                {
                    fetched = await _provider.GetAdsAsync(ct);
                }
                catch
                {
                    // Provider unavailable: serve stale cache if we have one, else empty.
                    return _cachedAds ?? new List<AdDto>();
                }

                if (fetched.Count > 0)
                {
                    _cachedAds = fetched.ToList();
                    _cacheExpiresAtUtc = DateTime.UtcNow.Add(CacheTtl);
                }

                return _cachedAds ?? new List<AdDto>();
            }
            finally
            {
                _refreshLock.Release();
            }
        }
    }
}
