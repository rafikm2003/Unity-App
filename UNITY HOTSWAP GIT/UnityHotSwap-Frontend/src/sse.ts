export type Msg =
  | { type: 'start'; dt: number; seconds: number }
  | { type: 'frame'; t: number; x: number; y: number }
  | { type: 'end' }
  | { type: 'diagnostics'; diagnostics: any }
  | { type: 'error'; message: string }

export function postSse(url: string, body: any, onMsg: (msg: Msg) => void) {
  const ctrl = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal
      })

      if (!res.ok || !res.body) {
        onMsg({ type: 'error', message: `HTTP ${res.status}` })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        let idx
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, idx).trim()
          buf = buf.slice(idx + 2)
          if (chunk.startsWith('data:')) {
            const json = chunk.slice(5).trim()
            try { onMsg(JSON.parse(json)) } catch {}
          }
        }
      }

      onMsg({ type: 'end' })
    } catch (e: any) {
      if (e?.name === 'AbortError' || ctrl.signal.aborted) {
        onMsg({ type: 'end' })
        return
      }
      onMsg({ type: 'error', message: 'SSE connection error' })
    }
  })()

  return () => ctrl.abort()
}
