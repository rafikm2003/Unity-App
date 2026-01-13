# Lekcja 2 - Prefaby i wiele obiektów w uproszczonej symulacji

W tej lekcji nauczysz się:

- co to jest **prefab** w grach i jak myśleć o wielu identycznych obiektach,
- jak w C# używać **kolekcji** (`List<T>`, tablice) do przechowywania wielu stanów,
- jak **dodawać** nowe obiekty w czasie gry (spawn),
- jak **usuwać** obiekty po spełnieniu warunku (np. wyleciały poza ekran),
- jak zamodelować to wszystko w uproszczonej symulacji z `State` i `IBehaviour`.

Część praktyczna tej lekcji prosi Cię o:

- A) użycie kolekcji,
- B) dodawanie nowych elementów,
- C) usuwanie elementów po warunku.

---

## 1. Idea prefabu w Unity

W klasycznym Unity:

- **Prefab** = zapisany szablon obiektu (np. pocisku, wroga, monety),
- możesz go instancjonować w czasie działania gry (`Instantiate(prefab, ...)`),
- wszystkie „kopie” mają to samo zachowanie, ale różne pozycje / parametry.

W tej platformie nie używamy wprost `GameObject`ów, ale idea jest identyczna:

> mamy **wiele obiektów tego samego typu**, każdy ma swój `State`.

---

## 2. Kolekcje w C# – tablice i listy

### Tablica

```csharp
State[] objects = new State[10];

for (int i = 0; i < objects.Length; i++)
{
    objects[i].x = i;      // każdy obiekt zaczyna w innej pozycji
}
Tablica ma stały rozmiar.

Lista (List<T>)
```csharp
using System.Collections.Generic;

List<State> objects = new List<State>();

objects.Add(new State { x = 0f, y = 0f, dt = 1f / 60f });
objects.Add(new State { x = 1f, y = 0f, dt = 1f / 60f });
```

Lista pozwala:

dynamicznie dodawać elementy (Add),

usuwać (Remove, RemoveAt, RemoveAll),

sprawdzać liczbę (Count).

3. Problem z struct + foreach – dlaczego to ważne
State jest strukturą (struct).
To znaczy, że przy zapisie:

```csharp
foreach (var s in objects)
{
    s.x += 1f;    // modyfikujesz KOPIĘ, nie element z listy
}
Zmiany nie trafią z powrotem do listy – s jest kopią.

Poprawny sposób (z indeksem):

```csharp
for (int i = 0; i < objects.Count; i++)
{
    var obj = objects[i];  // kopia
    obj.x += 1f;           // zmiana na kopii
    objects[i] = obj;      // zapis kopii z powrotem do listy
}
4. Dodawanie obiektów w czasie gry (spawn)
Częsty wzorzec:

mamy licznik czasu spawnTimer,

gdy minie określony czas (spawnInterval) → tworzymy nowy obiekt.

```csharp
using Contract;
using System.Collections.Generic;

public class SpawnerExample : IBehaviour
{
    private static List<State> objects = new List<State>();
    private float spawnTimer = 0f;
    private float spawnInterval = 1.0f; // co 1 sekundę

    public void Update(ref State s)
    {
        spawnTimer += s.dt;

        if (spawnTimer >= spawnInterval)
        {
            spawnTimer = 0f;
            SpawnNew(s);
        }

        UpdateObjects(s.dt);
    }

    private void SpawnNew(State baseState)
    {
        objects.Add(new State
        {
            x = -5f,
            y = 0f,
            t = baseState.t,
            dt = baseState.dt
        });
    }

    private void UpdateObjects(float dt)
    {
        for (int i = 0; i < objects.Count; i++)
        {
            var o = objects[i];
            o.x += 2f * dt;
            objects[i] = o;
        }
    }
}

```

To jeszcze mock – scena Unity może np. interpretować listę jako kilka wizualnych kostek.

5. Usuwanie obiektów – RemoveAt vs RemoveAll
Załóżmy, że obiekt ma „zniknąć”, gdy jego x przekroczy 10.

Pętla od końca + RemoveAt
```csharp
for (int i = objects.Count - 1; i >= 0; i--)
{
    if (objects[i].x > 10f)
    {
        objects.RemoveAt(i);
    }
}
```
Iterujemy od końca, żeby nie rozwalić indeksów.

RemoveAll z predykatem
```csharp
objects.RemoveAll(o => o.x > 10f);
```
To krótsza wersja: usuń wszystkie elementy, dla których warunek (o.x > 10f) jest prawdziwy.

6. Kompletny przykład – fala obiektów lecących w prawo
```csharp
using Contract;
using System.Collections.Generic;

public class MovingWave : IBehaviour
{
    private static List<State> objects = new List<State>();
    private float spawnTimer = 0f;
    private float spawnInterval = 0.5f; // co pół sekundy

    public void Update(ref State s)
    {
        // 1) Spawn nowych obiektów w czasie
        spawnTimer += s.dt;
        if (spawnTimer >= spawnInterval)
        {
            spawnTimer = 0f;
            Spawn(s);
        }

        // 2) Aktualizacja tych, które już istnieją
        for (int i = 0; i < objects.Count; i++)
        {
            var o = objects[i];

            o.x += 2f * s.dt; // ruch w prawo
            o.y = 0.25f * (float)System.Math.Sin(o.t);

            o.t += s.dt;      // lokalny czas obiektu
            objects[i] = o;
        }

        // 3) Usuwanie obiektów, które wyszły poza ekran
        objects.RemoveAll(o => o.x > 10f);
    }

    private void Spawn(State baseState)
    {
        objects.Add(new State
        {
            x = -5f,
            y = 0f,
            t = baseState.t,
            dt = baseState.dt
        });
    }
}
7. Typowe błędy
Brak kolekcji – przechowujesz tylko jeden State, więc tak naprawdę masz jeden obiekt.

Modyfikacja w foreach – patrz sekcja 3 – nic się nie zmienia na liście.

Usuwanie w pętli do przodu (for (i = 0; i < Count; i++) RemoveAt(i);) – część elementów jest pomijana.

Brak Add / Remove – liczba obiektów nigdy się nie zmienia, a testy patrzą na to.

8. Jak testy sprawdzą Twoją lekcję?
W części praktycznej testy backendowe patrzą m.in. na:

czy w kodzie występuje List< (kolekcja),

czy występuje .Add( (dodawanie obiektów),

czy występuje Remove (usuwanie).

To jest prosty „mock” – nie rozumie całej logiki, ale wymusza pracę z kolekcjami.

9. Podsumowanie – co musisz umieć
Znasz różnicę między tablicą a listą.

Wiesz, że dla struct trzeba się pilnować z kopiami (for + indeks).

Potrafisz:

dodać obiekt do listy (Add),

zaktualizować wszystkie obiekty pętlą,

usunąć obiekty po warunku (RemoveAt / RemoveAll).