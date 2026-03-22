using Microsoft.AspNetCore.Http;

namespace EduERP.Application.Interfaces;

public interface ICookieService
{
    void SetAccessTokenCookie(HttpResponse response, string token);
    void SetRefreshTokenCookie(HttpResponse response, string token);
    void SetCsrfTokenCookie(HttpResponse response, string token);
    void ClearAllTokenCookies(HttpResponse response);
}
