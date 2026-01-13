# Lekcja 0 - Wstęp do C#, programowania gier i działania silników takich jak Unity

Ta lekcja ma przygotować Cię **od absolutnych podstaw** do pisania kodu w lekcjach praktycznych.  
Zakładamy, że możesz:
- nie znać C#,
- nie znać Unity,
- nigdy nie pisać gier.

To jest OK – ta lekcja ma wprowadzić Cię od **„Hello World”** do tego, co dokładnie robisz w tej platformie edukacyjnej:  
piszesz klasę w C#, która implementuje `IBehaviour` i aktualizuje strukturę `State`.

Po tej lekcji będziesz rozumieć:
- czym jest C# i jak wygląda jego składnia,
- czym są **zmienne, typy, instrukcje if, pętle, metody**,
- czym są **klasy, struktury (`struct`), interfejsy (`interface`)**,
- jak działa **pętla gry** i po co nam `dt`,
- podstawy zasad **SOLID**.

---

## 1. Czym jest C#?
C# („si-szarp”) to nowoczesny, obiektowy język programowania używany m.in. w silniku Unity.

### Najprostszy program C# (wersja konsolowa)
```csharp
using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello World!");
    }
}
```

W grach to silnik (np. Unity) wywołuje Twój kod w każdej klatce za pomocą specjalnych metod, takich jak Update().

---

## 2. Zmienne i typy w C#

| Typ | Opis | Przykład |
|-----|------|----------|
| `int` | liczba całkowita | `int hp = 100;` |
| `float` | liczba zmiennoprzecinkowa | `float speed = 2.5f;` |
| `bool` | prawda/fałsz | `bool isAlive = true;` |
| `string` | tekst | `string name = "Goblin";` |

```csharp
int score = 0;
float x = 1.25f; // Pamiętaj o 'f' na końcu!
bool isRunning = false;
string title = "Moja Gra";
```

---

## 3. Podstawowe operatory

### Arytmetyka i ruch
```csharp
int sum = 5 + 2;      // 7
int points = 0;
points += 10;         // skrót od points = points + 10;
```

Przy ruchu w grach najczęściej zobaczysz:

```csharp
x += speed * dt;
```

---

## 4. Instrukcja warunkowa if
```csharp
if (hp <= 0)
{
    Console.WriteLine("Game Over!");
}
else
{
    Console.WriteLine("Gramy dalej.");
}
```

---

## 5. Pętle – powtarzanie czynności
```csharp
// Wykona się 5 razy
for (int i = 0; i < 5; i++)
{
    Console.WriteLine("i = " + i);
}

// Przejdzie przez wszystkie elementy listy
foreach (string enemy in enemies)
{
    Console.WriteLine("Przeciwnik: " + enemy);
}
```

---

## 6. Metody (funkcje)
Metoda to nazwany kawałek kodu. W naszej platformie najważniejsza jest ta:

```csharp
public void Update(ref State s)
{
    // Tutaj piszesz logikę, która wykonuje się co klatkę
}
```

---

## 7. Struktury (struct) i nasz State
Struktury są lżejsze od klas. Nasz State zawiera dane o pozycji i czasie:

```csharp
public struct State
{
    public float t;   // czas od początku symulacji
    public float dt;  // czas od ostatniej klatki
    public float x;   // pozycja X
    public float y;   // pozycja Y
}
```

---

## 8. Słowo kluczowe ref – dlaczego jest tak ważne?
`ref` oznacza, że metoda dostaje referencję do oryginału danych, a nie ich kopię.

```csharp
public void Update(ref State s)
{
    s.x += 2f; // Zmiana trafia bezpośrednio do silnika
}
```

---

## 9. Jak działa gra? Pętla gry i dt
Silniki działają w pętli. Aby ruch był płynny niezależnie od klatek na sekundę (FPS), używamy dt (Delta Time).

```csharp
// Wzór na stałą prędkość:
pozycja += prędkość * s.dt;
```

---

## 10. Przykład: Ruch w prawo + Sinus (Lekcja 1)
```csharp
using Contract;

public class MoveAndSine : IBehaviour
{
    public void Update(ref State s)
    {
        float speed = 2.0f;
        float amplitude = 0.5f;

        // Ruch w prawo
        s.x += speed * s.dt;

        // Ruch góra-dół przy użyciu sinusa i czasu całkowitego
        s.y = (float)System.Math.Sin(s.t) * amplitude;
    }
}
```

---

## 11. SOLID w pigułce
- **S (Single Responsibility)**: Klasa powinna robić jedną rzecz.
- **O (Open/Closed)**: Kod otwarty na rozszerzanie (nowe klasy), ale zamknięty na modyfikacje (nie psujemy starego).

---

## 12. Co przed Tobą?
- **Lekcja 1**: Podstawowy ruch.
- **Lekcja 2**: Zarządzanie listą obiektów.
- **Lekcja 3**: Wykrywanie kolizji.
- **Lekcja 4**: Refaktoryzacja do czystego kodu.