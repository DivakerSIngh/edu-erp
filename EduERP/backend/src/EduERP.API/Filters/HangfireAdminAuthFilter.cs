using Hangfire.Dashboard;

namespace EduERP.API.Filters;

/// <summary>
/// Restricts Hangfire dashboard access to authenticated Admin users.
/// </summary>
public class HangfireAdminAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (!httpContext.User.Identity?.IsAuthenticated ?? true)
            return false;

        return httpContext.User.IsInRole("Admin");
    }
}
