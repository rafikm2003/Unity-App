namespace CompilerHost.Entities;

public sealed class UserProgress
{
    public string UserId { get; set; } = default!;

    public int CompletedMask { get; set; }

    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;

    public bool IsCompleted(int lessonId)
    {
        if (lessonId < 0 || lessonId > 5) return false;
        return (CompletedMask & (1 << lessonId)) != 0;
    }

    public void SetCompleted(int lessonId, bool completed)
    {
        if (lessonId < 0 || lessonId > 5) return;
        if (completed) CompletedMask |= (1 << lessonId);
        else CompletedMask &= ~(1 << lessonId);
        UpdatedUtc = DateTime.UtcNow;
    }
}
