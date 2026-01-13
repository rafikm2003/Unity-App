import React from 'react'
import { Link } from 'react-router-dom'
import { lessons } from '../lessons'
import { useProgress } from '../progress'

export default function Home() {
  const { completed } = useProgress()

  const ordered = [...lessons].sort((a,b) => a.order - b.order)

  return (
    <div className="layout" style={{gridTemplateColumns: '1fr'}}>
      <div className="card" style={{maxWidth: 1100}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8}}>
          <h2 style={{margin:0}}>Wybierz lekcję</h2>
        </div>

        <div className="lessons-grid">
          {ordered.map(l => {
            const done = completed.has(l.id)
            return (
              <div key={l.id} className="lesson-card">
                <div className="lesson-header">
                  <div className="lesson-title">
                    <span className="lesson-badge">{l.level}</span>
                    <h3 style={{margin:0}}>
                      <span style={{opacity:.7, marginRight:6}}>{l.order}.</span>
                      {l.title}
                      {done && <span className="done-badge"> ✔ ukończona</span>}
                    </h3>
                  </div>
                  <div className="lesson-actions" style={{display:'flex', gap:8}}>
                    <Link className="btn primary" to={`/lesson/${l.id}`}>Otwórz</Link>
                    {l.hasPractice && <Link className="btn" to={`/practice?lesson=${l.id}`}>Praktyka</Link>}
                  </div>
                </div>

                <p className="lesson-desc">{l.subtitle}</p>

                {l.topics?.length ? (
                  <ul className="lesson-topics">
                    {l.topics.map(t => <li key={t}>{t}</li>)}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
