import { useEffect, useRef, useState } from "react"
import { gsap, ScrollTrigger } from "@/lib/scroll"

// Visualizador 360° por sequência de quadros (SPEC.md §4, Seção 5).
// Ângulo = giro da rolagem (ao entrar na tela) + arraste (com inércia) + giro
// lento automático quando parado. O ângulo é compartilhado entre variantes:
// trocar de modelo/cor mantém a mesma vista.

interface Viewer360Props {
  /** Pasta com NN.webp (01…count) — ex.: /gear/premium-preto */
  dir: string
  count: number
  label: string
  className?: string
}

const PX_PER_FRAME = 7
const IDLE_MS = 2500
const AUTO_FPS = 9

export function Viewer360({ dir, count, label, className = "" }: Viewer360Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const images = useRef<HTMLImageElement[]>([])
  const angle = useRef(0) // em quadros (float), compartilhado entre trocas de variante
  const scrollSpin = useRef(0)
  const [loaded, setLoaded] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const reduce = useRef(matchMedia("(prefers-reduced-motion: reduce)").matches)

  const frameAt = () => {
    const f = Math.round(angle.current + scrollSpin.current)
    return ((f % count) + count) % count
  }

  const draw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const img = images.current[frameAt()]
    if (!img?.complete || !img.naturalWidth) return
    const cw = canvas.width
    const ch = canvas.height
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
  }

  // Só começa a baixar quando o visualizador se aproxima da tela.
  const [near, setNear] = useState(false)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: "150% 0px" },
    )
    io.observe(wrap)
    return () => io.disconnect()
  }, [])

  // Carrega os quadros da variante atual.
  useEffect(() => {
    if (!near) return
    setLoaded(0)
    const isMobile = matchMedia("(max-width: 767px)").matches
    let done = 0
    images.current = Array.from({ length: count }, (_, i) => {
      const img = new Image()
      img.decoding = "async"
      img.onload = () => {
        done++
        setLoaded(done)
        if (i === frameAt()) draw()
      }
      img.src = `${dir}/${String(i + 1).padStart(2, "0")}${isMobile ? "-m" : ""}.webp`
      return img
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, count, near])

  // Tamanho do canvas (dpr ≤ 2)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Giro acompanhando a rolagem enquanto o visualizador entra na tela.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || reduce.current) return
    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top bottom",
      end: "center center",
      scrub: 0.8,
      onUpdate: (self) => {
        scrollSpin.current = (1 - self.progress) * -count // uma volta inteira até o centro
        draw()
      },
    })
    return () => st.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // Arraste com inércia + giro automático quando parado.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let dragging = false
    let lastX = 0
    let velocity = 0
    let lastT = 0
    let lastInput = 0
    let inertia: gsap.core.Tween | null = null
    let visible = false

    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastT = performance.now()
      velocity = 0
      inertia?.kill()
      wrap.setPointerCapture(e.pointerId)
      setInteracted(true)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const now = performance.now()
      const dx = e.clientX - lastX
      angle.current -= dx / PX_PER_FRAME
      velocity = -dx / PX_PER_FRAME / Math.max(1, now - lastT)
      lastX = e.clientX
      lastT = now
      lastInput = now
      draw()
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      lastInput = performance.now()
      const target = { v: angle.current }
      inertia = gsap.to(target, {
        v: angle.current + velocity * 450,
        duration: 1.2,
        ease: "power3.out",
        onUpdate: () => {
          angle.current = target.v
          draw()
        },
      })
    }
    // Setas do teclado giram de 1/24 de volta
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      angle.current += (e.key === "ArrowRight" ? 1 : -1) * (count / 24)
      lastInput = performance.now()
      setInteracted(true)
      draw()
    }

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.2 })
    io.observe(wrap)
    const tick = (_t: number, delta: number) => {
      if (reduce.current || dragging || !visible) return
      if (performance.now() - lastInput < IDLE_MS || inertia?.isActive()) return
      angle.current += (delta / 1000) * AUTO_FPS
      draw()
    }
    gsap.ticker.add(tick)

    wrap.addEventListener("pointerdown", down)
    wrap.addEventListener("pointermove", move)
    wrap.addEventListener("pointerup", up)
    wrap.addEventListener("pointercancel", up)
    wrap.addEventListener("keydown", key)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      inertia?.kill()
      wrap.removeEventListener("pointerdown", down)
      wrap.removeEventListener("pointermove", move)
      wrap.removeEventListener("pointerup", up)
      wrap.removeEventListener("pointercancel", up)
      wrap.removeEventListener("keydown", key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={`${label} — arraste ou use as setas do teclado para girar`}
      tabIndex={0}
      className={"relative cursor-grab touch-pan-y select-none active:cursor-grabbing " + className}
    >
      {/* viewer-mask: dissolve as bordas do fundo de estúdio no preto da página */}
      <canvas ref={canvasRef} className="viewer-mask h-full w-full transition-opacity duration-500" style={{ opacity: loaded ? 1 : 0 }} />
      {loaded < count && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center" aria-hidden="true">
          <span className="h-px w-24 bg-paper/15">
            <span className="block h-full bg-accent transition-[width] duration-300" style={{ width: `${(loaded / count) * 100}%` }} />
          </span>
        </div>
      )}
      <p
        className={
          "pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/70 transition-opacity duration-700 " +
          (interacted ? "opacity-0" : "opacity-100")
        }
      >
        <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true" className="text-accent">
          <path d="M1 6h20M5 2L1 6l4 4M17 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        Arraste para girar
      </p>
    </div>
  )
}
