# Lekcja 3 - Kolizje i reakcje w uproszczonej symulacji

W tej lekcji nauczysz się:

- czym jest **kolizja** (w kontekście 2D),
- jak wykrywać, czy obiekt znalazł się w określonym **obszarze**,
- jak reagować na kolizję (zmiana pozycji, zatrzymanie, odbicie),
- jak wydzielić logikę kolizji do **osobnej metody**, aby kod był czytelny.

Część praktyczna wymaga od Ciebie, żebyś:

- A) miał warunek kolizji (`if (...)`),
- B) zareagował na kolizję modyfikując `State`,
- C) wydzielił logikę kolizji do osobnej metody (np. `IsColliding`).

---

## 1. Co to jest kolizja?

Kolizja to sytuacja, gdy obiekty **w pewnym sensie nakładają się na siebie**:

- gracz wpada na ścianę,
- pocisk uderza w przeciwnika,
- postać wchodzi w obszar „pułapki” lub „triggera”.

W uproszczeniu w 2D często używa się:

- kolizji **punkt–prostokąt**,
- kolizji **punkt–koło**,
- kolizji **prostokąt–prostokąt** (AABB).

Tu skupimy się na pierwszych dwóch.

---

## 2. Kolizja punkt–prostokąt

Załóżmy, że mamy obszar:

- `minX`, `maxX`,
- `minY`, `maxY`.

Warunek, że punkt (`s.x`, `s.y`) jest w środku:

```csharp
bool inside =
    s.x >= minX && s.x <= maxX &&
    s.y >= minY && s.y <= maxY;
Przykład:

```csharp
float minX = 2f, maxX = 3f;
float minY = -0.5f, maxY = 0.5f;

bool isColliding =
    s.x >= minX && s.x <= maxX &&
    s.y >= minY && s.y <= maxY;
3. Prosta „strefa pułapki”

```csharp
using Contract;

public class TrapZone : IBehaviour
{
    public void Update(ref State s)
    {
        // ruch w prawo
        s.x += 2.0f * s.dt;

        // strefa pułapki
        float minX = 2f, maxX = 3f;
        float minY = -0.5f, maxY = 0.5f;

        bool hit =
            s.x >= minX && s.x <= maxX &&
            s.y >= minY && s.y <= maxY;

        if (hit)
        {
            // prosta reakcja: reset pozycji
            s.x = -2f;
            s.y = 0f;
        }
    }
}
4. Wydzielanie logiki kolizji do osobnej metody
Zamiast pisać wszystko w Update, możesz zrobić coś takiego:

```csharp
using Contract;

public class TrapZoneWithMethod : IBehaviour
{
    public void Update(ref State s)
    {
        s.x += 2.0f * s.dt;

        if (IsInsideTrap(s))
        {
            ReactToTrap(ref s);
        }
    }

    private bool IsInsideTrap(State s)
    {
        float minX = 2f, maxX = 3f;
        float minY = -0.5f, maxY = 0.5f;

        return
            s.x >= minX && s.x <= maxX &&
            s.y >= minY && s.y <= maxY;
    }

    private void ReactToTrap(ref State s)
    {
        s.x = -2f;
        s.y = 0f;
    }
}
Zalety:

Update jest krótkie i czytelne,

logika kolizji jest skupiona w jednej metodzie (IsInsideTrap),

reakcja w osobnej (ReactToTrap).

5. Kolizja punkt–koło
Czasem chcesz, żeby strefa kolizji była okręgiem (np. aura, pole rażenia).

Warunek:

```csharp
bool IsWithinCircle(State s, float centerX, float centerY, float radius)
{
    float dx = s.x - centerX;
    float dy = s.y - centerY;
    float distSq = dx * dx + dy * dy;

    return distSq <= radius * radius;
}
Użycie:

```csharp
if (IsWithinCircle(s, 0f, 0f, 1.5f))
{
    // kolizja z „okrągłą” strefą
}
6. Reakcja: odbicie od granic
Przykład prostego odbicia w poziomie:

```csharp
using Contract;

public class BounceExample : IBehaviour
{
    private float vx = 2.0f; // prędkość po X

    public void Update(ref State s)
    {
        s.x += vx * s.dt;

        float left = -3f;
        float right = 3f;

        if (s.x > right)
        {
            s.x = right;
            vx = -System.Math.Abs(vx); // odbij w lewo
        }
        else if (s.x < left)
        {
            s.x = left;
            vx = System.Math.Abs(vx);  // odbij w prawo
        }
    }
}
7. Szablon spełniający wymagania lekcji
Lekcja w praktyce wymaga:

if (warunki kolizji),

modyfikacji State wewnątrz tego if,

wydzielenia logiki do osobnej metody np. IsColliding(State s).

Przykład:

```csharp
using Contract;

public class SimpleCollision : IBehaviour
{
    public void Update(ref State s)
    {
        // ruch podstawowy
        s.x += 2.0f * s.dt;

        // sprawdzamy kolizję
        if (IsColliding(s))
        {
            // prosta reakcja: przesuń obiekt do góry
            s.y = 1.0f;
        }
    }

    private bool IsColliding(State s)
    {
        float minX = 2f, maxX = 3f;
        float minY = -0.5f, maxY = 0.5f;

        return
            s.x >= minX && s.x <= maxX &&
            s.y >= minY && s.y <= maxY;
    }
}
8. Jak testy Cię sprawdzają?
Testy backendowe (mock) w tej lekcji patrzą m.in. na to, czy:

pojawia się instrukcja if ( – czyli jakaś logika warunkowa,

wewnątrz modyfikujesz State (s.),

masz metodę o nazwie zawierającej np. IsColliding.

To wymusza:

napisanie warunku kolizji,

reakcję na niego,

wydzielenie tej logiki do osobnej metody.

9. Podsumowanie
Po tej lekcji powinieneś:

Wiedzieć, jak wykryć kolizję punkt–prostokąt i punkt–koło.

Umieć wydzielić logikę kolizji do osobnej metody.

Rozumieć, że reakcja na kolizję to po prostu modyfikacja stanu (State).