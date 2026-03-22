using System.Security.Claims;

namespace EduERP.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Returns the authenticated user's integer ID from the NameIdentifier claim (0 if absent).</summary>
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? user.FindFirstValue("sub");

        return int.TryParse(value, out var id) ? id : 0;
    }

    /// <summary>Returns the authenticated user's role claim.</summary>
    public static string? GetRole(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Role);
}
