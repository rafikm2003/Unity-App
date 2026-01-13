using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CompilerHost.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CompilerHost.Auth;

public sealed class JwtTokenService(IConfiguration config)
{
    public string CreateToken(AppUser user)
    {
        var issuer = config["Jwt:Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer");
        var audience = config["Jwt:Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience");
        var key = config["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
