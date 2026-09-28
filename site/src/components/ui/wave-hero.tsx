import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { OceanSound } from "@/lib/ocean-sound"
import { gsap, SplitText } from "@/lib/scroll"
import { SymbolDraw, SYMBOL_BRANCH_AT, SYMBOL_MAIN_LENGTH } from "./symbol-draw"

// Hero "Onda → Símbolo" — SPEC.md §4, Seção 1.
// Inspirado no MetroHero (21st.dev), mas sem travar a página: a seção é
// fixada com ScrollTrigger e o scroll comum avança o vídeo. Em telas de
// toque o vídeo vira sequência de imagens em canvas (mais confiável no iOS).

const VIDEO_SRC = "/hero/hero-onda.mp4"
const POSTER_SRC = "/hero/poster.webp"
const POSTER_PORTRAIT_SRC = "/hero/poster-p.webp"
/** Ponto de foco horizontal do vídeo (a espiral da onda fica à esquerda). */
const FOCUS_X = 0.36
// Dois jogos de quadros: paisagem (do vídeo 1280×716) e retrato (vídeo
// vertical próprio, 720×1276) — no celular em pé quase não há ampliação.
const FRAME_SETS = {
  landscape: { dir: "/hero/frames", count: 54, focusX: FOCUS_X },
  portrait: { dir: "/hero/frames-p", count: 50, focusX: 0.55 },
}
const frameSrc = (dir: string, i: number) => `${dir}/${String(i + 1).padStart(4, "0")}.webp`

type Mode = "video" | "frames" | "static"

function detectMode(): Mode {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "static"
  if (matchMedia("(pointer: coarse), (max-width: 767px)").matches) return "frames"
  return "video"
}

type SoundState = "armed" | "on" | "off"
const SOUND_PREF_KEY = "bw-sound"

function readSoundPref(): SoundState {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) === "off" ? "off" : "armed"
  } catch {
    return "armed"
  }
}

function saveSoundPref(value: "on" | "off") {
  try {
    localStorage.setItem(SOUND_PREF_KEY, value)
  } catch {
    /* sem storage: só não lembra a escolha */
  }
}

interface WaveHeroProps {
  title?: string
  ctaLabel?: string
  ctaHref?: string
}

export function WaveHero({
  title = "Toda onda nasce de uma perturbação.",
  ctaLabel = "Agendar aula experimental",
  ctaHref = "#aula-experimental",
}: WaveHeroProps) {
  const scope = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode] = useState<Mode>(detectMode)
  const [mediaReady, setMediaReady] = useState(false)
  // Som: ligado por padrão ("armed"), mas o navegador só libera áudio após um
  // gesto — então ele começa no primeiro toque/clique/tecla em qualquer lugar.
  // Se a pessoa desligar, a escolha fica salva e não insistimos mais.
  const soundRef = useRef<OceanSound | null>(null)
  const insideRef = useRef(true)
  const [soundState, setSoundState] = useState<SoundState>(readSoundPref)
  const soundOn = soundState === "on"
  const [isTouch] = useState(() => matchMedia("(pointer: coarse)").matches)

  const getSound = () => (soundRef.current ??= new OceanSound())

  const startSound = () => {
    const sound = getSound()
    sound.setInside(insideRef.current)
    sound.start().then(() => {
      if (sound.running) setSoundState("on")
    })
  }

  const toggleSound = () => {
    if (soundOn) {
      getSound().stop()
      setSoundState("off")
      saveSoundPref("off")
    } else {
      saveSoundPref("on")
      startSound()
    }
  }

  useEffect(() => {
    if (soundState !== "armed") return
    const events = ["pointerdown", "touchend", "keydown"] as const
    const onGesture = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return
      startSound()
    }
    events.forEach((ev) => window.addEventListener(ev, onGesture, { capture: true, passive: true }))
    return () => events.forEach((ev) => window.removeEventListener(ev, onGesture, { capture: true }))
  }, [soundState])

  useEffect(() => {
    const onVisibility = () => {
      const sound = soundRef.current
      if (!sound?.on) return
      sound.setInside(!document.hidden && insideRef.current)
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      soundRef.current?.dispose()
    }
  }, [])

  useGSAP(
    () => {
      if (mode === "static") return
      const root = scope.current!
      const q = gsap.utils.selector(root)

      // ── Mídia controlada pelo scroll ────────────────────────────
      let render: (p: number) => void = () => {}
      const cleanups: Array<() => void> = []

      if (mode === "video") {
        const video = videoRef.current!
        let seeking = false
        let pending: number | null = null
        const onSeeked = () => {
          seeking = false
          if (pending !== null) {
            const t = pending
            pending = null
            seeking = true
            video.currentTime = t
          }
        }
        const onLoaded = () => setMediaReady(true)
        video.addEventListener("seeked", onSeeked)
        video.addEventListener("loadeddata", onLoaded)
        if (video.readyState >= 2) onLoaded()
        cleanups.push(() => {
          video.removeEventListener("seeked", onSeeked)
          video.removeEventListener("loadeddata", onLoaded)
        })
        render = (p) => {
          const end = (video.duration || 4.5) - 0.05
          const t = p * end
          if (seeking) pending = t
          else {
            seeking = true
            video.currentTime = t
          }
        }
      } else {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!
        const set = window.innerHeight > window.innerWidth ? FRAME_SETS.portrait : FRAME_SETS.landscape
        const images = Array.from({ length: set.count }, (_, i) => {
          const img = new Image()
          img.decoding = "async"
          img.src = frameSrc(set.dir, i)
          return img
        })
        let current = 0
        const draw = () => {
          const img = images[current]
          if (!img.complete || !img.naturalWidth) return
          const cw = canvas.width
          const ch = canvas.height
          const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
          const w = img.naturalWidth * scale
          const h = img.naturalHeight * scale
          const x = Math.min(0, Math.max(cw - w, cw / 2 - w * set.focusX))
          ctx.imageSmoothingQuality = "high"
          ctx.clearRect(0, 0, cw, ch)
          ctx.drawImage(img, x, (ch - h) / 2, w, h)
        }
        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2)
          canvas.width = Math.round(canvas.clientWidth * dpr)
          canvas.height = Math.round(canvas.clientHeight * dpr)
          draw()
        }
        images[0].onload = () => {
          setMediaReady(true)
          resize()
        }
        resize()
        window.addEventListener("resize", resize)
        cleanups.push(() => window.removeEventListener("resize", resize))
        render = (p) => {
          const next = Math.round(p * (set.count - 1))
          if (next !== current) {
            current = next
            draw()
          }
        }
      }

      // ── Entrada (load) ──────────────────────────────────────────
      const split = SplitText.create(q("[data-title]")[0], { type: "lines", mask: "lines" })
      gsap.from(split.lines, { yPercent: 100, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.2 })
      gsap.from(q("[data-label]"), { autoAlpha: 0, y: 12, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.5 })

      const endItems = q("[data-end-item]")
      gsap.set(endItems, { autoAlpha: 0, y: 24, filter: "blur(8px)" })

      // ── Roteiro do scroll (duração total = 1) ───────────────────
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=250%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onLeave: () => {
            insideRef.current = false
            soundRef.current?.setInside(false)
          },
          onEnterBack: () => {
            insideRef.current = true
            soundRef.current?.setInside(true)
          },
        },
      })
      // O som segue o mesmo relógio suavizado (scrub) da imagem, não o scroll cru.
      tl.eventCallback("onUpdate", () => soundRef.current?.update(tl.progress()))

      const proxy = { p: 0 }
      tl.to(proxy, { p: 1, duration: 0.6, onUpdate: () => render(proxy.p) }, 0)
      tl.to(q("[data-media]"), { scale: 1.06, duration: 0.6 }, 0)
      tl.to(q("[data-hint]"), { autoAlpha: 0, duration: 0.03 }, 0)
      tl.to(q("[data-title]"), { autoAlpha: 0, y: -24, filter: "blur(10px)", duration: 0.25 }, 0)
      tl.to(q("[data-shade]"), { opacity: 0.92, duration: 0.16 }, 0.5)

      // Traço do símbolo: velocidade de caneta constante ao longo da linha.
      const DRAW_START = 0.58
      const DRAW_DUR = 0.3
      let t = DRAW_START
      for (const seg of q('[data-pen="main"]')) {
        const dur = (Number(seg.dataset.len) / SYMBOL_MAIN_LENGTH) * DRAW_DUR
        tl.set(seg, { opacity: 1 }, t)
        tl.to(seg, { strokeDashoffset: 0, duration: dur }, t)
        t += dur
      }
      let tb = DRAW_START + SYMBOL_BRANCH_AT * DRAW_DUR
      for (const seg of q('[data-pen="branch"]')) {
        const dur = (Number(seg.dataset.len) / SYMBOL_MAIN_LENGTH) * DRAW_DUR
        tl.set(seg, { opacity: 1 }, tb)
        tl.to(seg, { strokeDashoffset: 0, duration: dur }, tb)
        tb += dur
      }

      tl.to(endItems, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1, stagger: 0.03, ease: "power2.out" }, 0.84)
      tl.fromTo(q("[data-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)

      // ── Botão magnético (só ponteiro fino) ──────────────────────
      if (mode === "video") {
        const btn = q("[data-cta]")[0] as HTMLElement
        const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" })
        const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" })
        const move = (e: PointerEvent) => {
          const r = btn.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3)
          yTo((e.clientY - (r.top + r.height / 2)) * 0.3)
        }
        const leave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" })
        btn.addEventListener("pointermove", move)
        btn.addEventListener("pointerleave", leave)
        cleanups.push(() => {
          btn.removeEventListener("pointermove", move)
          btn.removeEventListener("pointerleave", leave)
        })
      }

      return () => cleanups.forEach((fn) => fn())
    },
    { scope, dependencies: [mode] },
  )

  const isStatic = mode === "static"

  return (
    <section
      ref={scope}
      id="topo"
      aria-label="Black Wave Jiu Jitsu Team"
      className="relative h-svh w-full overflow-hidden bg-ink text-paper"
    >
      {/* Mídia */}
      <div data-media className="absolute inset-0 origin-[36%_50%]">
        <picture>
          <source media="(orientation: portrait)" srcSet={POSTER_PORTRAIT_SRC} />
          <img
            src={POSTER_SRC}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${FOCUS_X * 100}% 50%` }}
          />
        </picture>
        {mode === "video" && (
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: mediaReady ? 1 : 0, objectPosition: `${FOCUS_X * 100}% 50%` }}
          />
        )}
        {mode === "frames" && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full transition-opacity duration-700"
            style={{ opacity: mediaReady ? 1 : 0 }}
          />
        )}
      </div>

      {/* Vinheta fixa + escurecimento controlado pelo scroll */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.75)_100%)]" />
      <div data-shade className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: isStatic ? 0.8 : 0 }} />

      {/* Rótulos de canto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-[var(--gutter)] pt-[clamp(1.25rem,3vw,2.5rem)] text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/70">
        <p data-label className="leading-[1.9]">
          Jiu Jitsu
          <br />
          Lifestyle
          <br />
          Community
        </p>
        <div className="flex flex-col items-end">
          <p data-label>Est. 2026</p>
          <button
            data-label
            data-sound-toggle
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Desligar som do mar" : "Ligar som do mar"}
            className="pointer-events-auto -mr-3 mt-1 flex items-center gap-2.5 px-3 py-3 uppercase tracking-[0.32em] transition-colors hover:text-paper"
          >
            <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={"eq-bar w-[2px] bg-current " + (soundOn ? "eq-bar--on" : "")}
                  style={{ animationDelay: `${i * -0.23}s` }}
                />
              ))}
            </span>
            <span className="pl-[0.32em]">Som</span>
          </button>
          <p
            aria-live="polite"
            className={
              "-mt-1 flex items-center gap-2 text-[0.625rem] normal-case tracking-[0.12em] text-paper/60 transition-opacity duration-700 " +
              (soundState === "armed" ? "opacity-100" : "opacity-0")
            }
          >
            {soundState === "armed" && (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                {isTouch ? "Toque na tela para ouvir o mar" : "Clique na página para ouvir o mar"}
              </>
            )}
          </p>
        </div>
      </div>
      <p
        data-label
        className="pointer-events-none absolute bottom-[clamp(1.25rem,3vw,2.5rem)] left-[var(--gutter)] hidden text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/70 sm:block"
      >
        São Luís — MA
      </p>

      {/* Título */}
      <h1
        data-title
        className={
          "absolute bottom-[clamp(5rem,16vh,11rem)] left-[var(--gutter)] max-w-[13ch] font-display text-[length:var(--fs-hero)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] " +
          (isStatic ? "sr-only" : "")
        }
      >
        {title}
      </h1>

      {/* Fechamento: símbolo + naming + slogan + CTA */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[clamp(1.25rem,3vh,2.25rem)] px-[var(--gutter)] [&_a]:pointer-events-auto">
        <SymbolDraw complete={isStatic} className="w-[min(88vw,1080px)]" />
        <div data-end-item className="flex flex-col items-center gap-3">
          <img src="/brand/naming-white.webp" alt="Black Wave" className="w-[min(70vw,560px)]" />
          <p className="pl-[0.6em] text-[length:var(--fs-label)] uppercase tracking-[0.6em] text-paper/70">Jiu Jitsu Team</p>
        </div>
        <img data-end-item src="/brand/slogan-white.webp" alt="Just Flow" className="w-[min(46vw,240px)]" />
        <a
          data-end-item
          data-cta
          href={ctaHref}
          className="group mt-2 inline-flex items-center gap-4 whitespace-nowrap border border-paper/40 px-5 py-4 text-xs uppercase tracking-[0.18em] transition-colors duration-300 hover:border-accent hover:bg-accent sm:px-7 sm:text-sm sm:tracking-[0.24em]"
        >
          {ctaLabel}
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </a>
      </div>

      {/* Dica de rolagem */}
      {!isStatic && (
        <div
          data-hint
          className="pointer-events-none absolute bottom-[clamp(1.25rem,3vw,2.5rem)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[length:var(--fs-label)] uppercase tracking-[0.4em] text-paper/70"
        >
          <span className="pl-[0.4em]">Role</span>
          <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden="true" className="animate-bounce">
            <path d="M6 1v15M1 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}

      {/* Progresso */}
      {!isStatic && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-paper/10">
          <div data-progress className="h-full w-full origin-left scale-x-0 bg-accent" />
        </div>
      )}
    </section>
  )
}
