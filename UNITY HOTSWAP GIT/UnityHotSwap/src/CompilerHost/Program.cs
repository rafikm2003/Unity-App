using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using CompilerHost.Auth;
using CompilerHost.Data;
using CompilerHost.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// -------------------------
// JSON
// -------------------------
builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// -------------------------
// DB (PostgreSQL) + Identity
// -------------------------
builder.Services.AddDbContext<AppDbContext>(opts =>
{
    var cs = builder.Configuration.GetConnectionString("Default");
    opts.UseNpgsql(cs);
});

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<JwtTokenService>();

// -------------------------
// JWT Auth
// -------------------------
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "UnityHotSwap.CompilerHost";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "UnityHotSwap.Frontend";
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in configuration");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// -------------------------
// CORS (dev)
// -------------------------
builder.Services.AddCors(o =>
{
    o.AddPolicy("dev", p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
    );
});

var app = builder.Build();

// DB INIT: w Dockerze Postgres może startować chwilę dłużej.
// Jeśli są migracje -> Migrate(), jeśli nie -> EnsureCreated() (tworzy tabele Identity + UserProgresses).
await InitDbAsync(app.Services, app.Logger);

app.UseCors("dev");
app.UseAuthentication();
app.UseAuthorization();

// -------------------------
// Health
// -------------------------
app.MapGet("/", () => Results.Ok(new { ok = true, service = "CompilerHost" }));
app.MapGet("/health", () => Results.Ok(new { ok = true }));

// =====================================================
// AUTH API
// =====================================================
app.MapPost("/api/auth/register",
    async (RegisterRequest req, UserManager<AppUser> userManager, AppDbContext db, JwtTokenService jwt) =>
    {
        var email = (req.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.Password))
            return Results.BadRequest(new { error = "Email and password are required." });

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
            return Results.Conflict(new { error = "User already exists." });

        var user = new AppUser
        {
            Email = email,
            UserName = email
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return Results.BadRequest(new
            {
                error = "Registration failed.",
                details = result.Errors.Select(e => new { e.Code, e.Description })
            });

        // Utwórz rekord postępu (0..5 = false)
        db.UserProgresses.Add(new UserProgress { UserId = user.Id, CompletedMask = 0 });
        await db.SaveChangesAsync();

        var token = jwt.CreateToken(user);
        return Results.Ok(new AuthResponse(token, user.Email!));
    });

app.MapPost("/api/auth/login",
    async (LoginRequest req, UserManager<AppUser> userManager, SignInManager<AppUser> signIn, JwtTokenService jwt) =>
    {
        var email = (req.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.Password))
            return Results.BadRequest(new { error = "Email and password are required." });

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return Results.Unauthorized();

        var check = await signIn.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return Results.Unauthorized();

        var token = jwt.CreateToken(user);
        return Results.Ok(new AuthResponse(token, user.Email!));
    });

app.MapGet("/api/auth/me",
    [Authorize] (System.Security.Claims.ClaimsPrincipal principal) =>
    {
        var email = principal.Claims.FirstOrDefault(c => c.Type.Contains("email"))?.Value
                    ?? principal.Identity?.Name
                    ?? "unknown";
        return Results.Ok(new MeResponse(email));
    });

// =====================================================
// PROGRESS API (lekcje 0..5)
// =====================================================
app.MapGet("/api/progress",
    [Authorize] async (System.Security.Claims.ClaimsPrincipal principal, AppDbContext db) =>
    {
        var userId = principal.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value;

        var progress = await db.UserProgresses.FindAsync(userId);
        if (progress is null)
        {
            progress = new UserProgress { UserId = userId, CompletedMask = 0 };
            db.UserProgresses.Add(progress);
            await db.SaveChangesAsync();
        }

        var completed = Enumerable.Range(0, 6).Select(i => progress.IsCompleted(i)).ToArray();
        var completedCount = completed.Count(x => x);

        return Results.Ok(new ProgressResponse(completed, completedCount, 6));
    });

app.MapPost("/api/progress/set",
    [Authorize] async (SetLessonCompletionRequest req, System.Security.Claims.ClaimsPrincipal principal, AppDbContext db) =>
    {
        if (req.LessonId < 0 || req.LessonId > 5)
            return Results.BadRequest(new { error = "LessonId must be in range 0..5" });

        var userId = principal.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value;

        var progress = await db.UserProgresses.FindAsync(userId);
        if (progress is null)
        {
            progress = new UserProgress { UserId = userId, CompletedMask = 0 };
            db.UserProgresses.Add(progress);
        }

        progress.SetCompleted(req.LessonId, req.Completed);
        await db.SaveChangesAsync();

        var completed = Enumerable.Range(0, 6).Select(i => progress.IsCompleted(i)).ToArray();
        var completedCount = completed.Count(x => x);
        return Results.Ok(new ProgressResponse(completed, completedCount, 6));
    });

// =====================================================
// TWOJE DOTYCHASOWE ENDPOINTY (compile/simulate/tests)
// + automatyczne oznaczanie lekcji jako ukończonej, gdy testy zaliczone
// =====================================================

app.MapPost("/api/compile-dll", (CompileReq req) =>
{
    var result = CompileToDll(req.Code);
    return Results.Ok(result);
});

app.MapPost("/api/simulate", (SimReq req) =>
{
    var sim = Simulate(req.Code, req.Steps, req.Dt);
    return Results.Ok(sim);
});

app.MapPost("/api/tests",
    async (TestsReq req, HttpContext http, AppDbContext db) =>
    {
        var resp = RunLessonTests(req.LessonId, req.Code);

        // Jeśli zaliczone i user zalogowany -> zapisz postęp do DB
        if (resp.Passed && http.User?.Identity?.IsAuthenticated == true)
        {
            if (int.TryParse(req.LessonId, out var lessonId) && lessonId is >= 0 and <= 5)
            {
                var userId = http.User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value;

                var progress = await db.UserProgresses.FindAsync(userId);
                if (progress is null)
                {
                    progress = new UserProgress { UserId = userId, CompletedMask = 0 };
                    db.UserProgresses.Add(progress);
                }

                progress.SetCompleted(lessonId, true);
                await db.SaveChangesAsync();
            }
        }

        return Results.Ok(resp);
    });

app.Run();

// -------------------------
// DB init (migracje lub EnsureCreated)
// -------------------------
static async Task InitDbAsync(IServiceProvider services, Microsoft.Extensions.Logging.ILogger logger)
{
    const int maxAttempts = 25;
    const int delayMs = 1000;

    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                var hasMigrations = db.Database.GetMigrations().Any();
                if (hasMigrations)
                    await db.Database.MigrateAsync();
                else
                    await db.Database.EnsureCreatedAsync();
            }
            catch
            {
                await db.Database.EnsureCreatedAsync();
            }

            logger.LogInformation("DB init OK.");
            return;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "DB init failed (attempt {Attempt}/{Max}).", attempt, maxAttempts);
            if (attempt == maxAttempts) throw;
            await Task.Delay(delayMs);
        }
    }
}

// =====================================================
// IMPLEMENTACJA: Roslyn compile + simulate + tests
// =====================================================

static CompileResp CompileToDll(string code)
{
    var compilation = CreateCompilation(code);

    using var ms = new MemoryStream();
    var emit = compilation.Emit(ms);

    var diags = emit.Diagnostics.Select(MapDiag).ToArray();

    if (!emit.Success)
        return new CompileResp(false, null, diags);

    var bytes = ms.ToArray();
    return new CompileResp(true, Convert.ToBase64String(bytes), diags);
}

static SimResp Simulate(string code, int steps, float dt)
{
    steps = steps <= 0 ? 60 : steps;
    dt = dt <= 0 ? 1f / 60f : dt;

    var compilation = CreateCompilation(code);

    using var ms = new MemoryStream();
    var emit = compilation.Emit(ms);

    var diags = emit.Diagnostics.Select(MapDiag).ToArray();
    if (!emit.Success)
        return new SimResp(false, diags, Array.Empty<StateSample>());

    ms.Position = 0;
    var asm = Assembly.Load(ms.ToArray());

    var behaviourType = asm.GetTypes().FirstOrDefault(t =>
        typeof(Contract.IBehaviour).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract);

    if (behaviourType is null)
        return new SimResp(false, diags, Array.Empty<StateSample>());

    var behaviour = (Contract.IBehaviour)Activator.CreateInstance(behaviourType)!;

    var s = new Contract.State { t = 0, dt = dt, x = 0, y = 0 };
    var samples = new List<StateSample>(steps);

    for (var i = 0; i < steps; i++)
    {
        behaviour.Update(ref s);
        samples.Add(new StateSample(i, s.t, s.dt, s.x, s.y));
        s.t += s.dt;
    }

    return new SimResp(true, diags, samples);
}

static TestsResp RunLessonTests(string lessonId, string code)
{
    var cfg = PracticeConfig.Configs.FirstOrDefault(c => c.LessonId == lessonId);
    if (cfg is null)
        return new TestsResp(false, new[] { new PracticeTestResult("config", false, "Nie znaleziono konfiguracji lekcji.") });

    var results = cfg.Tests.Select(t =>
    {
        var ok = t.Regexes.All(r => System.Text.RegularExpressions.Regex.IsMatch(code ?? string.Empty, r,
            System.Text.RegularExpressions.RegexOptions.Multiline));

        return new PracticeTestResult(t.Name, ok, ok ? "OK" : (t.FailMessage ?? "Nie zaliczono."));
    }).ToArray();

    var passed = results.All(r => r.Passed);
    return new TestsResp(passed, results);
}

static CSharpCompilation CreateCompilation(string code)
{
    var syntaxTree = CSharpSyntaxTree.ParseText(code ?? string.Empty);

    // 1) Wszystkie zaufane assembly runtime (najpewniejsze na .NET 8+)
    var tpa = (string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES");
    if (string.IsNullOrWhiteSpace(tpa))
        throw new InvalidOperationException("TRUSTED_PLATFORM_ASSEMBLIES is not available.");

    var references = tpa
        .Split(Path.PathSeparator)
        .Select(p => MetadataReference.CreateFromFile(p))
        .ToList();

    // 2) Dodaj kontrakt (jeśli Contract jest w tym samym projekcie, to i tak będzie już w TPA,
    // ale zostawiamy jawnie - nie szkodzi, a bywa pomocne przy refaktorach)
    references.Add(MetadataReference.CreateFromFile(typeof(Contract.IBehaviour).Assembly.Location));

    // 3) Kompilacja
    return CSharpCompilation.Create(
        assemblyName: $"UserScript_{Guid.NewGuid():N}",
        syntaxTrees: new[] { syntaxTree },
        references: references,
        options: new CSharpCompilationOptions(
            OutputKind.DynamicallyLinkedLibrary,
            optimizationLevel: OptimizationLevel.Release,
            allowUnsafe: false
        )
    );
}

static DiagDto MapDiag(Diagnostic d)
{
    var lineSpan = d.Location.GetLineSpan();
    var line = lineSpan.StartLinePosition.Line + 1;
    var col = lineSpan.StartLinePosition.Character + 1;

    return new DiagDto(
        Id: d.Id,
        Severity: d.Severity.ToString(),
        Message: d.GetMessage(),
        Line: d.Location.IsInSource ? line : null,
        Column: d.Location.IsInSource ? col : null
    );
}

// ==================
// DTO / modele domeny API
// ==================

public sealed record CompileReq(string Code);
public sealed record CompileResp(bool Success, string? Base64Dll, IReadOnlyList<DiagDto> Diagnostics);

public sealed record SimReq(string Code, int Steps, float Dt);
public sealed record SimResp(bool Success, IReadOnlyList<DiagDto> Diagnostics, IReadOnlyList<StateSample> Samples);

public sealed record TestsReq(string LessonId, string Code);
public sealed record TestsResp(bool Passed, IReadOnlyList<PracticeTestResult> Results);

public sealed record PracticeTestResult(string Name, bool Passed, string Message);

public sealed record StateSample(int Step, float T, float Dt, float X, float Y);

public sealed record DiagDto(string Id, string Severity, string Message, int? Line, int? Column);

// ==================
// Konfiguracja lekcji (przykład)
// ==================
public sealed record PracticeConfig(string LessonId, string TaskTitle, string TaskDescription, IReadOnlyList<PracticeTest> Tests)
{
    public static readonly IReadOnlyList<PracticeConfig> Configs = new[]
    {
        new PracticeConfig(
            LessonId: "1",
            TaskTitle: "Zadanie: ruch w prawo i fala sinusoidalna",
            TaskDescription: "Napisz klasę implementującą Contract.IBehaviour i w Update(...) modyfikuj State (x,y).",
            Tests: new[]
            {
                new PracticeTest("Ma klasę IBehaviour", new[] { "class", "IBehaviour" }, "Brakuje klasy implementującej IBehaviour."),
                new PracticeTest("Używa s.x", new[] { "s\\.x" }, "Nie widać modyfikacji s.x."),
                new PracticeTest("Używa s.y", new[] { "s\\.y" }, "Nie widać modyfikacji s.y.")
            }
        ),

        new PracticeConfig(
            LessonId: "2",
            TaskTitle: "Zadanie: „prefaby” i kolekcja obiektów (mock)",
            TaskDescription: string.Join("\n", new[]
            {
                "Ta scena udaje prosty system wielu obiektów (mock – sprawdzamy tylko strukturę kodu).",
                "",
                "Twoje zadania:",
                "A) Dodaj kolekcję (np. List<State> lub tablicę) przechowującą wiele „instancji” obiektów.",
                "B) Zaimplementuj prostą logikę dodawania nowych elementów do tej kolekcji (np. gdy minie określony czas).",
                "C) Dodaj usuwanie elementów z kolekcji po spełnieniu warunku (np. gdy x przekroczy pewną wartość)."
            }),
            Tests: new[]
            {
                new PracticeTest(
                    "Ma kolekcję obiektów",
                    new[] { "(List\\s*<\\s*(Contract\\.)?State\\s*>|\\b(Contract\\.)?State\\s*\\[\\s*\\])" },
                    "Dodaj kolekcję obiektów (np. List<State> lub tablicę State[])."
                ),
                new PracticeTest(
                    "Dodaje elementy do kolekcji",
                    new[] { "\\.Add\\s*\\(" },
                    "Brakuje logiki dodawania elementów do kolekcji (np. lista.Add(...))."
                ),
                new PracticeTest(
                    "Usuwa elementy z kolekcji",
                    new[] { "(\\.Remove(All|At)?\\s*\\(|\\.RemoveRange\\s*\\(|\\.Clear\\s*\\()" },
                    "Brakuje logiki usuwania elementów z kolekcji (Remove/RemoveAt/RemoveAll itp.)."
                )
            }
        ),

        new PracticeConfig(
            LessonId: "3",
            TaskTitle: "Zadanie: reakcja na „kolizję” (mock)",
            TaskDescription: string.Join("\n", new[]
            {
                "W tej scenie symulujemy koncepcję kolizji w uproszczony sposób.",
                "",
                "Twoje zadania:",
                "A) Dodaj prosty warunek kolizji, np. gdy pozycja x i y obiektu znajdzie się w określonym zakresie.",
                "B) Zareaguj na kolizję – zmień jakąś wartość w State (np. ustaw flagę albo zmień kierunek ruchu).",
                "C) Wydziel logikę wykrywania kolizji do osobnej metody, żeby była czytelniejsza."
            }),
            Tests: new[]
            {
                new PracticeTest(
                    "Ma warunek „kolizji” zależny od x i y",
                    new[] { "s\\.x\\s*[<>]=?\\s*[-+*/()\\w\\.]+", "s\\.y\\s*[<>]=?\\s*[-+*/()\\w\\.]+" },
                    "Dodaj warunek kolizji wykorzystujący porównania na s.x i s.y."
                ),
                new PracticeTest(
                    "Reaguje na kolizję zmianą stanu",
                    new[] { "s\\.(x|y)\\s*=" },
                    "Po wykryciu kolizji zmień stan (np. ustaw s.x/s.y lub zmień kierunek ruchu)."
                ),
                new PracticeTest(
                    "Wydziela wykrywanie kolizji do metody",
                    new[] { "\\b(bool|void)\\s+(IsCollision|CheckCollision|DetectCollision|Collision)\\s*\\(" },
                    "Wydziel logikę wykrywania kolizji do osobnej metody (np. CheckCollision)."
                )
            }
        ),

        new PracticeConfig(
            LessonId: "4",
            TaskTitle: "Zadanie: mały refaktoring pod SOLID (mock)",
            TaskDescription: string.Join("\n", new[]
            {
                "Ta scena dotyczy porządkowania kodu gameplayowego, ale w trybie mock – sprawdzamy tylko strukturę.",
                "",
                "Twoje zadania:",
                "A) Wyodrębnij część logiki ruchu do osobnej klasy lub metody, żeby State.Update było krótsze.",
                "B) Dodaj interfejs opisujący zachowanie (np. IMovement), który można w przyszłości rozszerzać.",
                "C) Zadbaj o jedną odpowiedzialność: osobna klasa/metoda do logiki wizualnej, osobna do logiki ruchu."
            }),
            Tests: new[]
            {
                new PracticeTest(
                    "Wyodrębnia logikę ruchu do metody",
                    new[] { "\\bvoid\\s+(UpdateMovement|Move|ApplyMovement|Movement)\\s*\\(" },
                    "Wyodrębnij logikę ruchu do osobnej metody (np. Move/UpdateMovement)."
                ),
                new PracticeTest(
                    "Definiuje interfejs IMovement",
                    new[] { "\\binterface\\s+IMovement\\b" },
                    "Dodaj interfejs opisujący zachowanie ruchu (np. IMovement)."
                ),
                new PracticeTest(
                    "Wyodrębnia logikę wizualną do metody",
                    new[] { "\\bvoid\\s+(UpdateVisual|Render|ApplyVisual|Visual)\\s*\\(" },
                    "Wydziel logikę wizualną do osobnej metody (np. Render/UpdateVisual)."
                )
            }
        )
    };
}

public sealed record PracticeTest(string Name, IReadOnlyList<string> Regexes, string? FailMessage);

namespace Contract
{
    public struct State
    {
        public float t;
        public float dt;
        public float x;
        public float y;
    }

    public interface IBehaviour
    {
        void Update(ref State s);
    }
}
