# Lekcja 1 - Podstawowy ruch w Unity (C#) w oparciu o czas i sinus

W tej lekcji nauczysz się:

- przesuwać obiekt **w prawo** po osi X,
- dodawać **falowy ruch góra–dół** po osi Y (sinusoida),
- używać czasu (`t`, `dt`), aby ruch był **niezależny od liczby klatek**,
- pisać poprawną klasę implementującą `IBehaviour` w tej platformie.

Celem jest to, aby po tej lekcji część praktyczna (zadania A, B, C) była dla Ciebie naturalnym krokiem:
- A) ruch w prawo,
- B) ruch sinusoidalny po Y,
- C) korzystanie z `dt` w obliczeniach.

---

## 1. Powtórka z czasu w grach – `t` i `dt`

Struktura `State`:

```csharp
public struct State
{
    public float t;   // czas od startu symulacji
    public float dt;  // czas między kolejnymi wywołaniami Update
    public float x;   // pozycja pozioma
    public float y;   // pozycja pionowa
}
s.dt – ile czasu minęło od poprzedniego wywołania Update,

s.t – łączny czas od początku symulacji.

Zasada ruchu:

Ruch = prędkość * czas
a więc w każdej klatce:
pozycja += prędkość * dt.

2. Ruch w prawo - najprostszy możliwy przykład
Chcemy, żeby obiekt przesuwał się w prawo ze stałą prędkością speed.

```csharp
using Contract;

public class MoveRight : IBehaviour
{
    public void Update(ref State s)
    {
        float speed = 2.0f;      // jednostki na sekundę
        s.x += speed * s.dt;     // ruch w prawo
    }
}
Co się dzieje?

Każda klatka zwiększa s.x o speed * s.dt,

niezależnie od FPS po 1 sekundzie x wzrośnie w przybliżeniu o 2.0f.

3. Sinus – ruch falowy po Y
Funkcję sinus możesz traktować jako „falę”:

jej wartości zmieniają się płynnie między -1 i 1,

nadaje się idealnie do ruchu „góra–dół”.

Wzór:

```csharp
y = A * sin(2π * f * t)
A – amplituda (wysokość fali),

f – częstotliwość (ile fal na sekundę),

t – czas.

W C#:

```csharp
float amplitude = 0.25f;
float frequency = 1.0f;  // 1 fala na sekundę

double angle = 2 * System.Math.PI * frequency * s.t;
s.y = amplitude * (float)System.Math.Sin(angle);
4. Połączenie: ruch w prawo + fala po Y
Teraz łączymy oba efekty:

```csharp
using Contract;

public class MoveAndSine : IBehaviour
{
    public void Update(ref State s)
    {
        float speed     = 2.0f;   // ruch w prawo
        float amplitude = 0.25f;  // wysokość fali
        float frequency = 1.0f;   // cykle na sekundę

        // 1) ruch w prawo
        s.x += speed * s.dt;

        // 2) ruch góra–dół
        double angle = 2 * System.Math.PI * frequency * s.t;
        s.y = amplitude * (float)System.Math.Sin(angle);
    }
}
To jest dokładnie kod, który logicznie pasuje do części praktycznej.

5. Najczęstsze błędy i jak ich uniknąć
❌ Błąd 1 – brak dt w obliczeniach

```csharp
s.x += 2.0f;  // ZŁE
Szybszy komputer → więcej klatek → obiekt „odpływa” szybciej.

Wolniejszy → ruch ślimaczy.

✔️ Poprawnie:

```csharp
s.x += 2.0f * s.dt;
❌ Błąd 2 – dodawanie sinusa zamiast przypisywania

```csharp
s.y += 0.25f * (float)System.Math.Sin(s.t);  // ZŁE (narastający dryf)
W każdej klatce dodajesz wartość sinusa, więc pozycja zaczyna „uciekać”.

✔️ Poprawnie (przypisanie):

```csharp
s.y = 0.25f * (float)System.Math.Sin(s.t);
❌ Błąd 3 – brak using Contract; lub brak IBehaviour
Musisz mieć:

```csharp
using Contract;

public class MyClass : IBehaviour
{
    public void Update(ref State s)
    {
        // ...
    }
}
Bez tego kod się nie skompiluje albo silnik nie znajdzie Twojej klasy.

6. Małe ćwiczenia „na sucho”
Zadanie 1:
Jak zmienić kod, żeby obiekt poruszał się w lewo?

Podpowiedź: wystarczy zmienić znak prędkości.

Zadanie 2:
Jak sprawić, by ruch falowy był „mniejszy” (mniejsza amplituda)?

Zadanie 3:
Co się stanie, gdy ustawisz frequency = 0.5f?
A co, gdy frequency = 3.0f?

Spróbuj odpowiedzieć, a potem to po prostu przetestuj w części praktycznej.

7. Jak testy sprawdzą Twoje rozwiązanie?
W części praktycznej tej lekcji testy (po stronie backendu) robią m.in.:

szukają w kodzie wystąpienia modyfikacji s.x (ruch w prawo),

szukają użycia System.Math.Sin (fala po Y),

szukają s.dt (ruch zależny od czasu).

Jeśli:

użyjesz s.x += ...,

pojawi się System.Math.Sin,

w obliczeniach występuje s.dt,

to większość testów powinna być zielona ✅ i scena pokaże poprawny ruch.

8. Podsumowanie – co musisz zapamiętać
Ruch zawsze licz jako pozycja += prędkość * dt.

Sinus (System.Math.Sin) jest idealny do ruchów falowych.

Twoja klasa musi implementować IBehaviour i mieć Update(ref State s).

Drobna różnica += vs = przy s.y robi ogromną różnicę w ruchu.