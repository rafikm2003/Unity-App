export function getStarterCode(lessonId: string): string {
  switch (lessonId) {
    case "1":
      return `using Contract;

public class MoveAndSine : // TODO
{
    public void Update(ref State s)
    {
        //TODO
    }
}`;
    case "2":
      return `using Contract;


public class MyBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // TODO
    }
}`;
    case "3":
      return `using Contract;

public class MyBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // TODO
    }
}`;
    case "4":
      return `using Contract;

public class MyBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // TODO
    }
}`;
    case "5":
      return `using Contract;

// Lekcja 5: TODO
public class MyBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // TODO
    }
}`;
    default:
      return `using Contract;

public class MyBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // TODO
    }
}`;
  }
}
