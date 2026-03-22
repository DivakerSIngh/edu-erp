namespace EduERP.Domain.Entities;

/// <summary>
/// Base class for all entities.
/// Provides common audit fields enforced on every table.
/// </summary>
public abstract class BaseEntity
{
    public DateTime  CreatedAt  { get; set; }
    public int       CreatedBy  { get; set; }
    public DateTime? UpdatedAt  { get; set; }
    public int?      UpdatedBy  { get; set; }
    public bool      IsDeleted  { get; set; }
    public DateTime? DeletedAt  { get; set; }
    public int?      DeletedBy  { get; set; }
}
