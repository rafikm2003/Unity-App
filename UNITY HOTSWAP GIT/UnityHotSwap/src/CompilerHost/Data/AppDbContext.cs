using CompilerHost.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CompilerHost.Data;

public sealed class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<UserProgress> UserProgresses => Set<UserProgress>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<UserProgress>(e =>
        {
            e.HasKey(x => x.UserId);
            e.Property(x => x.CompletedMask).IsRequired();
            e.Property(x => x.UpdatedUtc).IsRequired();
        });
    }
}
