namespace CompilerHost.Auth;

public sealed record RegisterRequest(string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, string Email);

public sealed record MeResponse(string Email);

public sealed record ProgressResponse(
    IReadOnlyList<bool> Completed,
    int CompletedCount,
    int Total
);

public sealed record SetLessonCompletionRequest(int LessonId, bool Completed);
