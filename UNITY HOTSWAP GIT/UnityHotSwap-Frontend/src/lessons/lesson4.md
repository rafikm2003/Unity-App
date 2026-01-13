# Lekcja 4 - Dobre praktyki i SOLID w kodzie gameplayowym

W tej lekcji nauczysz się:

- dlaczego „działający kod” to za mało,
- jak rozbijać „klasy–potwory” na mniejsze, czytelne fragmenty,
- jak w prosty sposób stosować zasady **SOLID** w kontekście gier,
- jak używać **interfejsów** i metod pomocniczych, aby kod był łatwiejszy w rozwoju.

Część praktyczna będzie od Ciebie wymagała:

- wydzielenia części logiki do osobnej metody (np. `ApplyMovement`),
- zdefiniowania prostego **interfejsu** związanego z zachowaniem,
- uporządkowania kodu tak, by nie wszystko było w `Update`.

---

## 1. Problem: klasy–potwory („god objects”)

Bardzo typowy błąd w grach:

```csharp
public class PlayerController : MonoBehaviour
{
    void Update()
    {
        // ruch
        // skok
        // atak
        // kontrola animacji
        // odtwarzanie dźwięków
        // zapis do pliku
        // ...
    }
}
Skutki:

ciężko zrozumieć, co się dzieje,

trudno dodać nową funkcjonalność,

boimy się czegokolwiek dotykać („bo się popsuje”).

Ta lekcja ma pokazać Ci, jak z tym walczyć.

2. S - Single Responsibility Principle (Jedna odpowiedzialność)
Definicja (luźno):

Każda klasa powinna robić jedną rzecz i robić ją dobrze.

Zły przykład

```csharp
using Contract;

public class BadBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // ruch
        s.x += 2f * s.dt;

        // logika skoku
        if (s.t < 1f)
        {
            s.y = (float)System.Math.Sin(s.t * System.Math.PI);
        }

        // zapis stanu do pliku (inna odpowiedzialność)
        System.IO.File.WriteAllText("save.txt", $"x={s.x},y={s.y}");
    }
}
Trochę lepszy przykład – rozbicie na małe klasy

```csharp
public class MovementLogic
{
    public void Apply(ref State s)
    {
        s.x += 2f * s.dt;
    }
}

public class JumpLogic
{
    public void Apply(ref State s)
    {
        if (s.t < 1f)
        {
            s.y = (float)System.Math.Sin(s.t * System.Math.PI);
        }
    }
}
A następnie:

```csharp
using Contract;

public class GoodBehaviour : IBehaviour
{
    private readonly MovementLogic movement = new MovementLogic();
    private readonly JumpLogic jump = new JumpLogic();

    public void Update(ref State s)
    {
        movement.Apply(ref s);
        jump.Apply(ref s);
    }
}
3. O - Open/Closed Principle (Otwarty na rozszerzanie, zamknięty na modyfikacje)
Załóż, że chcesz mieć różne style ruchu:

ruch prosty,

ruch sinusoidalny,

ruch losowy.

Złe podejście:

```csharp
public class Movement
{
    public string mode = "straight";

    public void Apply(ref State s)
    {
        if (mode == "straight")
        {
            s.x += 2f * s.dt;
        }
        else if (mode == "sine")
        {
            s.y = 0.25f * (float)System.Math.Sin(s.t);
        }
        else if (mode == "random")
        {
            // ...
        }
    }
}
Za każdym razem, gdy dodajesz nowy tryb, musisz modyfikować Movement.

Lepsze podejście – interfejs i klasy pochodne:

```csharp
public interface IMovement
{
    void Move(ref State s);
}

public class StraightMovement : IMovement
{
    public void Move(ref State s)
    {
        s.x += 2f * s.dt;
    }
}

public class SineMovement : IMovement
{
    public void Move(ref State s)
    {
        s.y = 0.25f * (float)System.Math.Sin(s.t);
    }
}
Użycie:

```csharp
using Contract;

public class MovementBehaviour : IBehaviour
{
    private readonly IMovement movement;

    public MovementBehaviour()
    {
        movement = new StraightMovement(); // można łatwo podmienić na SineMovement
    }

    public void Update(ref State s)
    {
        movement.Move(ref s);
    }
}
Dodanie nowego ruchu = nowa klasa implementująca IMovement (bez ruszania starych).

4. I - Interface Segregation Principle (Małe interfejsy)
Duży interfejs:

```csharp
public interface IEnemy
{
    void Move();
    void Attack();
    void Die();
    void SaveToFile();
}
Każda klasa implementująca IEnemy musi znać się na zapisie pliku – nawet jeśli tego nie używa.

Lepsze podejście:

```csharp
public interface IMovable { void Move(); }
public interface IAttackable { void Attack(); }
public interface IKillable { void Die(); }
W naszej platformie już widzisz to podejście:

IBehaviour – odpowiedzialny za update w czasie,

dodatkowe interfejsy możesz tworzyć sam (np. IMovement).

5. D - Dependency Inversion Principle (Zależ od abstrakcji)
Zamiast:

```csharp
public class Game
{
    private StraightMovement movement = new StraightMovement();
}
lepiej:

```csharp
public class Game
{
    private readonly IMovement movement;

    public Game(IMovement movement)
    {
        this.movement = movement;
    }
}
Oznacza to, że:

nie jesteś przyklejony do jednej konkretnej klasy,

możesz podać dowolną implementację IMovement.

W prostym kontekście naszej platformy możesz zrobić coś takiego:

```csharp
using Contract;

public class SolidExampleBehaviour : IBehaviour
{
    private readonly IMovement movement;

    public SolidExampleBehaviour()
    {
        movement = new StraightMovement();
    }

    public void Update(ref State s)
    {
        ApplyMovement(ref s);
    }

    private void ApplyMovement(ref State s)
    {
        movement.Move(ref s);
    }
}
6. Refaktoryzacja przykładu z poprzednich lekcji
Załóżmy, że masz klasyczny „misz-masz”:

```csharp
using Contract;

public class MixedBehaviour : IBehaviour
{
    public void Update(ref State s)
    {
        // ruch
        s.x += 2f * s.dt;
        s.y = 0.25f * (float)System.Math.Sin(s.t);

        // kolizja
        if (s.x > 2f && s.x < 3f && s.y > -0.5f && s.y < 0.5f)
        {
            s.x = -2f;
            s.y = 0f;
        }
    }
}
Krok 1 - wydziel ruch

```csharp
public class MovementLogic
{
    public void Apply(ref State s)
    {
        s.x += 2f * s.dt;
        s.y = 0.25f * (float)System.Math.Sin(s.t);
    }
}
Krok 2 - wydziel kolizję

```csharp
public class CollisionLogic
{
    public bool IsInsideZone(State s)
    {
        return s.x > 2f && s.x < 3f && s.y > -0.5f && s.y < 0.5f;
    }

    public void React(ref State s)
    {
        s.x = -2f;
        s.y = 0f;
    }
}
Krok 3 - prostszy Behaviour

```csharp
using Contract;

public class RefactoredBehaviour : IBehaviour
{
    private readonly MovementLogic movement = new MovementLogic();
    private readonly CollisionLogic collision = new CollisionLogic();

    public void Update(ref State s)
    {
        movement.Apply(ref s);

        if (collision.IsInsideZone(s))
        {
            collision.React(ref s);
        }
    }
}
Teraz:

łatwiej jest zrozumieć, co się dzieje w Update,

możesz w przyszłości np. podmienić MovementLogic na inną implementację.

7. Jak testy ocenią Twoją lekcję?
W części praktycznej testy backendowe (mock) będą sprawdzać m.in., czy:

w kodzie pojawia się jakakolwiek definicja interfejsu (interface ),

wydzielasz metodę pomocniczą (np. ApplyMovement),

używasz słowa kluczowego class (dodatkowa klasa).

Przykładowy minimalny szablon spełniający idee lekcji:

```csharp
using Contract;

public interface IMovement
{
    void Move(ref State s);
}

public class StraightMovement : IMovement
{
    public void Move(ref State s)
    {
        s.x += 2f * s.dt;
    }
}

public class SolidExampleBehaviour : IBehaviour
{
    private readonly IMovement movement = new StraightMovement();

    public void Update(ref State s)
    {
        ApplyMovement(ref s);
    }

    private void ApplyMovement(ref State s)
    {
        movement.Move(ref s);
    }
}
8. Podsumowanie
Po tej lekcji powinieneś:

Rozumieć, dlaczego rozbijanie kodu na małe kawałki poprawia jego jakość.

Wiedzieć, jak użyć interfejsów (interface) w prostym, gameplayowym kontekście.

Umieć napisać Behaviour, który:

korzysta z dodatkowej klasy (np. MovementLogic),

ma metodę pomocniczą typu ApplyMovement,

ewentualnie używa interfejsu (IMovement).