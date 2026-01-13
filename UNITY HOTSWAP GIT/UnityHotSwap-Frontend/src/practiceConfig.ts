export type PracticeConfig = {
  lessonId: string
  taskTitle: string
  taskDescription: string
}

export const practiceConfigs: PracticeConfig[] = [
  {
    lessonId: '1',
    taskTitle: 'Zadanie: ruch w prawo i fala sinusoidalna',
    taskDescription: [
      'Masz pojedynczy obiekt reprezentowany przez strukturę State (pola: t, dt, x, y).',
      '',
      'Twoje zadania:',
      'A) Spraw, aby obiekt poruszał się w prawo po osi X ze stałą prędkością (użyj s.x i s.dt).',
      'B) Dodaj pionowy ruch w górę i w dół oparty na funkcji sinus (użyj System.Math.Sin i przypisz do s.y).',
      'C) Upewnij się, że wszystkie ruchy zależą od czasu dt, a nie od liczby klatek.'
    ].join('\n'),
  },
  {
    lessonId: '2',
    taskTitle: 'Zadanie: „prefaby” i kolekcja obiektów (mock)',
    taskDescription: [
      'Ta scena udaje prosty system wielu obiektów (mock – sprawdzamy tylko strukturę kodu).',
      '',
      'Twoje zadania:',
      'A) Dodaj kolekcję (np. List<State> lub tablicę) przechowującą wiele „instancji” obiektów.',
      'B) Zaimplementuj prostą logikę dodawania nowych elementów do tej kolekcji (np. gdy minie określony czas).',
      'C) Dodaj usuwanie elementów z kolekcji po spełnieniu warunku (np. gdy x przekroczy pewną wartość).'
    ].join('\n'),
  },
  {
    lessonId: '3',
    taskTitle: 'Zadanie: reakcja na „kolizję” (mock)',
    taskDescription: [
      'W tej scenie symulujemy koncepcję kolizji w uproszczony sposób.',
      '',
      'Twoje zadania:',
      'A) Dodaj prosty warunek kolizji, np. gdy pozycja x i y obiektu znajdzie się w określonym zakresie.',
      'B) Zareaguj na kolizję – zmień jakąś wartość w State (np. ustaw flagę albo zmień kierunek ruchu).',
      'C) Wydziel logikę wykrywania kolizji do osobnej metody, żeby była czytelniejsza.'
    ].join('\n'),
  },
  {
    lessonId: '4',
    taskTitle: 'Zadanie: mały refaktoring pod SOLID (mock)',
    taskDescription: [
      'Ta scena dotyczy porządkowania kodu gameplayowego, ale w trybie mock – sprawdzamy tylko strukturę.',
      '',
      'Twoje zadania:',
      'A) Wyodrębnij część logiki ruchu do osobnej klasy lub metody, żeby State.Update było krótsze.',
      'B) Dodaj interfejs opisujący zachowanie (np. IMovement), który można w przyszłości rozszerzać.',
      'C) Zadbaj o jedną odpowiedzialność: osobna klasa/metoda do logiki wizualnej, osobna do logiki ruchu.'
    ].join('\n'),
  },
]

export function getPracticeConfig(lessonId: string): PracticeConfig | undefined {
  return practiceConfigs.find(c => c.lessonId === lessonId)
}
