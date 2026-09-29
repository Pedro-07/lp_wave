import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { OceanSound } from "@/lib/ocean-sound"
import { gsap, ScrollTrigger, SplitText } from "@/lib/scroll"
import { CtaLink } from "./cta-link"
import { addSymbolDraw, SymbolDraw } from "./symbol-draw"

// Hero "Onda → Símbolo" — SPEC.md §4, Seção 1.
// Abertura automática, numa etapa só: ao abrir o site a onda corre, o símbolo
// se desenha, a marca aparece e o CTA ganha destaque — sem precisar rolar.
// Celular em pé usa o vídeo vertical próprio; o resto, o horizontal.

const VIDEOS = {
  landscape: { src: "/hero/hero-onda-h.mp4", focusX: 0.36 },
  portrait: { src: "/hero/hero-onda-v.mp4", focusX: 0.55 },
}
const POSTER_SRC = "/hero/poster.webp"
const POSTER_PORTRAIT_SRC = "/hero/poster-p.webp"
/** Ponto de foco horizontal do pôster paisagem (a espiral da onda fica à esquerda). */
const FOCUS_X = 0.36

type Mode = "play" | "static"

const detectMode = (): Mode => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "static" : "play")
const pickVideo = () => (matchMedia("(orientation: portrait)").matches ? VIDEOS.portrait : VIDEOS.landscape)

/** Duração da abertura inteira, em segundos (1 unidade do roteiro). */
const INTRO_SECONDS = 7.5
/** Pausa para o título de abertura ser lido antes da onda correr. */
const TITLE_HOLD_MS = 1400
/** Espera máxima pelo vídeo antes de a abertura seguir sem ele. */
const MEDIA_WAIT_MS = 2500

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
  const [mode] = useState<Mode>(detectMode)
  const [video] = useState(pickVideo)
  const [mediaReady, setMediaReady] = useState(false)
  // Som: o navegador só libera áudio após um gesto, então ele começa
  // desligado; o botão SOM no canto liga/desliga a qualquer momento.
  const soundRef = useRef<OceanSound | null>(null)
  const insideRef = useRef(true)
  const [soundOn, setSoundOn] = useState(false)

  const getSound = () => (soundRef.current ??= new OceanSound())

  const startSound = () => {
    const sound = getSound()
    sound.setInside(insideRef.current)
    sound.start().then(() => {
      if (sound.running) setSoundOn(true)
    })
  }

  const toggleSound = () => {
    if (soundOn) {
      getSound().stop()
      setSoundOn(false)
    } else {
      startSound()
    }
  }

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

      const cleanups: Array<() => void> = []
      const videoEl = videoRef.current!
      const onLoaded = () => setMediaReady(true)
      videoEl.addEventListener("loadeddata", onLoaded)
      if (videoEl.readyState >= 2) onLoaded()
      cleanups.push(() => videoEl.removeEventListener("loadeddata", onLoaded))

      const endItems = q("[data-end-item]")
      const cta = q("[data-cta]")[0] as HTMLElement
      gsap.set(endItems, { autoAlpha: 0, y: 24, filter: "blur(8px)" })
      gsap.set(q("[data-hint]"), { autoAlpha: 0 })

      // ── Roteiro da abertura (1 unidade = INTRO_SECONDS) ─────────
      // Mesmas marcas do antigo roteiro por scroll, agora tocadas sozinhas.
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
      tl.timeScale(1 / INTRO_SECONDS)
      // O som segue o mesmo relógio da imagem (a quebra coincide com o escurecimento).
      tl.eventCallback("onUpdate", () => soundRef.current?.update(Math.min(tl.time(), 1)))

      // A onda (vídeo) ocupa as primeiras 0,6 unidades.
      tl.to(q("[data-media]"), { scale: 1.06, duration: 0.6, ease: "sine.inOut" }, 0)
      tl.to(q("[data-title]"), { autoAlpha: 0, y: -24, filter: "blur(10px)", duration: 0.12, ease: "power2.in" }, 0.16)
      tl.to(q("[data-shade]"), { opacity: 0.92, duration: 0.16, ease: "power1.inOut" }, 0.5)

      // Traço do símbolo: velocidade de caneta constante ao longo da linha.
      addSymbolDraw(tl, root, 0.58, 0.3)

      tl.to(endItems, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1, stagger: 0.03, ease: "power2.out" }, 0.84)
      tl.fromTo(q("[data-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      tl.to(q("[data-progress]"), { autoAlpha: 0, duration: 0.05 }, 1)
      // Fim: o CTA acende (cor de acento + pulso) e a dica de rolagem aparece.
      tl.call(() => cta.classList.add("cta-live"), undefined, 1)
      tl.to(q("[data-hint]"), { autoAlpha: 1, duration: 0.06 }, 1.04)

      // Link direto para uma seção: a abertura já aparece pronta.
      const hash = location.hash.slice(1)
      if (hash && hash !== "topo") {
        tl.progress(1)
      } else {
        // A timeline parte quando o vídeo de fato começa a tocar (ou segue sem
        // ele se o navegador bloquear/demorar — o pôster fica no lugar).
        let started = false
        let wait = 0
        const start = () => {
          if (started) return
          started = true
          window.clearTimeout(wait)
          tl.play()
        }
        // Velocidade ajustada para a onda caber no trecho dela no roteiro.
        const fit = () => {
          if (videoEl.duration) videoEl.playbackRate = videoEl.duration / (0.6 * INTRO_SECONDS)
        }
        const hold = window.setTimeout(() => {
          fit()
          videoEl.addEventListener("loadedmetadata", fit, { once: true })
          videoEl.addEventListener("playing", start, { once: true })
          videoEl.play().catch(start)
          wait = window.setTimeout(start, MEDIA_WAIT_MS)
        }, TITLE_HOLD_MS)
        cleanups.push(() => {
          window.clearTimeout(hold)
          window.clearTimeout(wait)
          videoEl.removeEventListener("loadedmetadata", fit)
          videoEl.removeEventListener("playing", start)
        })
      }
      cleanups.push(() => tl.kill())

      // Som só dentro do hero.
      const inside = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom top",
        onLeave: () => {
          insideRef.current = false
          soundRef.current?.setInside(false)
        },
        onEnterBack: () => {
          insideRef.current = true
          soundRef.current?.setInside(true)
        },
      })
      cleanups.push(() => inside.kill())

      // ── Botão magnético (só ponteiro fino) ──────────────────────
      if (matchMedia("(pointer: fine)").matches) {
        const btn = cta
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

  // ── Título de abertura (load) ──
  useGSAP(
    () => {
      if (mode === "static") return
      const q = gsap.utils.selector(scope.current)
      const split = SplitText.create(q("[data-title]")[0], { type: "lines", mask: "lines", aria: "none" })
      gsap.from(split.lines, { yPercent: 100, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.35 })
      gsap.from(q("[data-label]"), { opacity: 0, y: 12, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.6 })
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
        {mode === "play" && (
          <video
            ref={videoRef}
            src={video.src}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: mediaReady ? 1 : 0, objectPosition: `${video.focusX * 100}% 50%` }}
          />
        )}
      </div>

      {/* Vinheta fixa + escurecimento da abertura */}
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
          <img src="/brand/naming-white.webp" alt="Black Wave" width={1400} height={158} className="h-auto w-[min(70vw,560px)]" />
          <p className="pl-[0.6em] text-[length:var(--fs-label)] uppercase tracking-[0.6em] text-paper/70">Jiu Jitsu Team</p>
        </div>
        <img data-end-item src="/brand/slogan-white.webp" alt="Just Flow" width={1400} height={530} className="h-auto w-[min(46vw,240px)]" />
        <CtaLink data-end-item data-cta href={ctaHref} className={"mt-2 " + (isStatic ? "cta-live" : "")}>
          {ctaLabel}
        </CtaLink>
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
