using Dapper;
using System.Data;

namespace EduERP.Infrastructure.Data.Repositories;

/// <summary>
/// Base repository — thin wrapper around Dapper that enforces stored-procedure-only access.
/// No raw SQL queries are permitted in any derived repository.
/// All database interaction goes through named SPs with typed parameters.
/// </summary>
public abstract class BaseRepository
{
    private readonly IDbConnectionFactory _factory;

    protected BaseRepository(IDbConnectionFactory factory)
    {
        _factory = factory;
    }

    /// <summary>Execute a SP and return a collection of T.</summary>
    protected async Task<IEnumerable<T>> QueryAsync<T>(
        string storedProcedure,
        object? parameters  = null,
        bool    readOnly    = false,
        int     commandTimeout = 30)
    {
        using var conn = _factory.CreateConnection(readOnly);
        return await conn.QueryAsync<T>(
            storedProcedure,
            parameters,
            commandType:    CommandType.StoredProcedure,
            commandTimeout: commandTimeout);
    }

    /// <summary>Execute a SP and return the first result or null.</summary>
    protected async Task<T?> QueryFirstOrDefaultAsync<T>(
        string storedProcedure,
        object? parameters  = null,
        bool    readOnly    = false)
    {
        using var conn = _factory.CreateConnection(readOnly);
        return await conn.QueryFirstOrDefaultAsync<T>(
            storedProcedure,
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    /// <summary>Execute a SP that returns multiple result sets.</summary>
    protected async Task<SqlMapper.GridReader> QueryMultipleAsync(
        string storedProcedure,
        object? parameters = null,
        bool    readOnly   = false)
    {
        var conn = _factory.CreateConnection(readOnly);  // Do NOT wrap in using — caller consumes the reader
        return await conn.QueryMultipleAsync(
            storedProcedure,
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    /// <summary>Execute a SP that performs an INSERT/UPDATE/DELETE (no result set).</summary>
    protected async Task ExecuteAsync(
        string storedProcedure,
        object? parameters = null)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(
            storedProcedure,
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    /// <summary>Execute a SP and return a single scalar value.</summary>
    protected async Task<T?> ExecuteScalarAsync<T>(
        string storedProcedure,
        object? parameters = null)
    {
        using var conn = _factory.CreateConnection();
        return await conn.ExecuteScalarAsync<T>(
            storedProcedure,
            parameters,
            commandType: CommandType.StoredProcedure);
    }

    /// <summary>Execute a SP inside an explicit transaction (for multi-step operations).</summary>
    protected async Task ExecuteInTransactionAsync(
        Func<IDbConnection, IDbTransaction, Task> work)
    {
        using var conn = _factory.CreateConnection();
        using var tx   = conn.BeginTransaction();
        try
        {
            await work(conn, tx);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }
}
