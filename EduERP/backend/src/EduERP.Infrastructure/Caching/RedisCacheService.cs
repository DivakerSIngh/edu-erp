using StackExchange.Redis;

namespace EduERP.Infrastructure.Caching;

public interface IRedisCacheService
{
    Task<string?> GetAsync(string key);
    Task SetAsync(string key, string value, TimeSpan expiry);
    Task DeleteAsync(string key);
}

public class RedisCacheService : IRedisCacheService
{
    private readonly IDatabase _db;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    public async Task<string?> GetAsync(string key)
    {
        var val = await _db.StringGetAsync(key);
        return val.HasValue ? val.ToString() : null;
    }

    public Task SetAsync(string key, string value, TimeSpan expiry)
        => _db.StringSetAsync(key, value, expiry);

    public Task DeleteAsync(string key)
        => _db.KeyDeleteAsync(key);
}
