using Dapper;
using System.Data;
using Microsoft.Data.SqlClient;

namespace EduERP.Infrastructure.Data;

/// <summary>
/// Creates SqlConnection instances from the configured connection string.
/// Uses ADO.NET connection pooling automatically.
/// </summary>
public interface IDbConnectionFactory
{
    IDbConnection CreateConnection(bool readOnly = false);
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _primary;
    private readonly string _readReplica;

    public DbConnectionFactory(string primary, string? replica = null)
    {
        _primary     = primary ?? throw new ArgumentNullException(nameof(primary));
        _readReplica = string.IsNullOrEmpty(replica) ? primary : replica;
    }

    public IDbConnection CreateConnection(bool readOnly = false)
    {
        var conn = new SqlConnection(readOnly ? _readReplica : _primary);
        conn.Open();
        // SQL Server requires these SET options for indexed views, filtered indexes,
        // computed column indexes, etc.  ADO.NET does not set them by default.
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON;";
        cmd.ExecuteNonQuery();
        return conn;
    }
}
