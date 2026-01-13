import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getLessonById } from '../lessons'
import { useProgress } from '../progress'

export default function LessonTheory() {
  const { id } = useParams()
  const { markDone, completed } = useProgress()

  const lesson = getLessonById(id || '')
  if (!lesson) return <Navigate to="/" />

  const done = completed.has(lesson.id)

  return (
    <div className="layout" style={{gridTemplateColumns: '1fr'}}>
      <div className="card" style={{maxWidth: 1100}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0}}>
            <span style={{opacity:.7, marginRight:6}}>{lesson.order}.</span>
            {lesson.title}
          </h2>
          <div style={{display:'flex', gap:8}}>
            <Link className="btn" to="/">← Powrót</Link>
            {lesson.hasPractice && <Link className="btn" to={`/practice?lesson=${lesson.id}`}>Przejdź do praktyki →</Link>}
          </div>
        </div>

        <div className="md" style={{marginTop:12}}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.markdown}
          </ReactMarkdown>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', marginTop:16}}>
          <div />
          <div style={{display:'flex', gap:8}}>
            {lesson.hasPractice && <Link className="btn" to={`/practice?lesson=${lesson.id}`}>Przejdź do praktyki →</Link>}
            <button
              className="btn primary"
              onClick={() => markDone(lesson.id)}
              disabled={done}
              title={done ? 'Już oznaczona jako ukończona' : 'Oznacz tę lekcję jako ukończoną'}
            >
              {done ? '✔ Ukończona' : 'Oznacz jako ukończoną'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
