import { useEffect, useState } from "react"

// Fila de tarefas para momentos ociosos do navegador. As seções abaixo do hero
// montam suas animações aqui, uma por vez (cada uma numa tarefa curta), em vez
// de todas juntas no carregamento — o celular não trava e a ordem de montagem
// continua a do DOM (de cima para baixo), que é a que os pins precisam.

type IdleCb = () => void
const queue: IdleCb[] = []
let running = false

const requestIdle: (cb: () => void) => void =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 800 })
    : (cb) => window.setTimeout(cb, 32)

function pump() {
  const next = queue.shift()
  if (!next) {
    running = false
    return
  }
  running = true
  requestIdle(() => {
    next()
    pump()
  })
}

export function enqueueIdle(cb: IdleCb) {
  queue.push(cb)
  if (!running) pump()
}

/** true quando chegou a vez desta seção na fila ociosa. */
export function useIdleReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    enqueueIdle(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])
  return ready
}
