namespace EduERP.Domain.Exceptions;

/// <summary>Base for all domain-layer exceptions.</summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

/// <summary>Resource does not exist or has been soft-deleted.</summary>
public class NotFoundException : DomainException
{
    public NotFoundException(string resource, object id)
        : base($"{resource} with id '{id}' was not found.") { }

    public NotFoundException(string message) : base(message) { }
}

/// <summary>Authentication failed or token is invalid.</summary>
public class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message) : base(message) { }
}

/// <summary>Authenticated user lacks the required permission.</summary>
public class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message) { }
}

/// <summary>Duplicate resource conflict (e.g., email already exists).</summary>
public class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Input validation failed — carries field-level error details.</summary>
public class ValidationException : DomainException
{
    public IDictionary<string, string> Errors { get; }

    public ValidationException(IDictionary<string, string> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : base("One or more validation errors occurred.")
    {
        Errors = new Dictionary<string, string> { [field] = message };
    }
}
