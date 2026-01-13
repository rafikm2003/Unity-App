// @ts-ignore
import lesson0md from './lesson0.md?raw'
// @ts-ignore
import lesson1md from './lesson1.md?raw'
// @ts-ignore
import lesson2md from './lesson2.md?raw'
// @ts-ignore
import lesson3md from './lesson3.md?raw'
// @ts-ignore
import lesson4md from './lesson4.md?raw'

export type Lesson = {
  id: string            // "0".."4"
  order: number         // 0..4 - do sortowania i wyświetlania numeru
  title: string
  subtitle: string
  level: 'początkujący' | 'średniozaaw.' | 'zaaw.'
  topics?: string[]
  markdown: string
  hasPractice: boolean  // true dla 1..4
}

export const lessons: Lesson[] = [
  {
    id: '0',
    order: 0,
    title: 'Lekcja 0 - Wprowadzenie i dobre nawyki (teoria)',
    subtitle: 'Pierwsze kroki i higiena pracy: struktura projektu, nazewnictwo, zasady współpracy.',
    level: 'początkujący',
    topics: ['Struktura', 'Nazewnictwo', 'Czytelność', 'Iteracja'],
    markdown: lesson0md,
    hasPractice: false
  },
  {
    id: '1',
    order: 1,
    title: 'Lekcja 1 - Podstawowy ruch w Unity (C#)',
    subtitle: 'Ruch w prawo, skok i prosta kombinacja - teoria z gifami oraz przykładowy kod.',
    level: 'początkujący',
    topics: ['Ruch po osi X', 'Skok', 'Sinusoida', 'Update(dt)'],
    markdown: lesson1md,
    hasPractice: true
  },
  {
    id: '2',
    order: 2,
    title: 'Lekcja 2 - Prefaby i instancje',
    subtitle: 'Tworzenie prefabów, instancjonowanie w runtime i proste zarządzanie obiektami.',
    level: 'początkujący',
    topics: ['Prefab', 'Instantiate', 'Destroy', 'Pooling (wstęp)'],
    markdown: lesson2md,
    hasPractice: true
  },
  {
    id: '3',
    order: 3,
    title: 'Lekcja 3 - Kolizje i prosta fizyka',
    subtitle: 'Podstawy komponentów Rigidbody i Collider oraz wykrywanie kolizji.',
    level: 'średniozaaw.',
    topics: ['Rigidbody', 'Collider', 'OnCollisionEnter', 'OnTriggerEnter'],
    markdown: lesson3md,
    hasPractice: true
  },
  {
    id: '4',
    order: 4,
    title: 'Lekcja 4 - Dobre praktyki i SOLID',
    subtitle: 'Zasady SOLID i porządkowanie kodu gameplayowego - podejście komponentowe.',
    level: 'zaaw.',
    topics: ['SRP', 'OCP', 'Komponenty', 'Czytelność i testowalność'],
    markdown: lesson4md,
    hasPractice: true
  }
]

export function getLessonById(id: string) {
  return lessons.find(l => l.id === id)
}
