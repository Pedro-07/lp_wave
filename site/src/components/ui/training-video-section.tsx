import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { goToSection } from "./site-menu"
import { useIdleReady } from "@/lib/idle"
import { gsap, SplitText } from "@/lib/scroll"

// Seção 3 — "O tatame" (SPEC.md §4). Vídeo de apresentação: começa numa
// janela no centro e se expande até a tela cheia conforme a rolagem, com a
// imagem ganhando luz e nitidez. Mudo em loop; "Assistir com som" liga o áudio.
// Horizontal no desktop, vertical no celular em pé.

const VIDEO = {
  landscape: { src: "/tatame/treino.mp4", poster: "/tatame/treino-poster.webp" },
  portrait: { src: "/tatame/treino-v.mp4", poster: "/tatame/treino-v-poster.webp" },
}

export function TrainingVideoSection() {
  const scope = useRef<HTMLElement>(null)
  /** Monta as animações num momento ocioso (ver lib/idle.ts). */
  const idleReady = useIdleReady()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isStatic] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
  const [source] = useState(() => (window.innerHeight > window.innerWidth ? VIDEO.portrait : VIDEO.landscape))
  const [withSound, setWithSound] = useState(false)
  /** O vídeo só é baixado quando a seção se aproxima (poupa dados e o início da página). */
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = scope.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: "100% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Toca só quando está na tela (economiza bateria e dados) e silencia ao sair.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isStatic) video.play().catch(() => {})
        } else {
          video.pause()
          video.muted = true
          setWithSound(false)
        }
      },
      { threshold: 0.15 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [isStatic])

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    const next = !withSound
    video.muted = !next
    if (next) video.play().catch(() => {})
    setWithSound(next)
  }

  useGSAP(
    () => {
      if (!idleReady) return
      if (isStatic) return
      const q = gsap.utils.selector(scope.current)
      const titleWords = SplitText.create(q("[data-tatame-title]")[0], { type: "words", aria: "none" }).words
      gsap.set(titleWords, { yPercent: 60, autoAlpha: 0, filter: "blur(10px)" })
      // opacity (não autoAlpha): os botões continuam alcançáveis pelo Tab
      gsap.set(q("[data-tatame-actions]"), { opacity: 0, y: 16 })

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: q("[data-tatame-stage]")[0],
          start: "top top",
          end: () => "+=" + window.innerHeight * 1.4,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // Janela → tela cheia
      tl.fromTo(
        q("[data-tatame-frame]"),
        { clipPath: "inset(24% 28% 24% 28%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power2.inOut" },
        0,
      )
      tl.fromTo(
        q("[data-tatame-video]"),
        { scale: 1.2, filter: "brightness(0.55) blur(4px)" },
        { scale: 1, filter: "brightness(1) blur(0px)", duration: 0.7, ease: "power2.inOut" },
        0,
      )
      // Legenda e dica saem assim que a janela começa a abrir.
      tl.to(q("[data-tatame-caption]"), { autoAlpha: 0, y: 16, duration: 0.14, ease: "power2.in" }, 0.02)
      // Frase de tela cheia + ações
      tl.to(titleWords, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.25, stagger: 0.05, ease: "power3.out" }, 0.62)
      tl.to(q("[data-tatame-actions]"), { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.8)
      tl.to({}, { duration: 0.15 }) // respiro antes de soltar
    },
    { scope, dependencies: [idleReady] },
  )

  return (
    <section ref={scope} id="tatame" aria-labelledby="tatame-titulo" className="relative bg-ink text-paper">
      <div data-tatame-stage className="relative h-svh overflow-hidden">
        <p className="absolute top-[clamp(1.5rem,6vh,4rem)] left-[var(--gutter)] z-10 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60">
          <span className="text-accent">03</span> — O tatame
        </p>

        {/* Vídeo: a janela é um clip-path sobre a tela cheia */}
        <div data-tatame-frame className="absolute inset-0" style={isStatic ? undefined : { clipPath: "inset(24% 28% 24% 28%)" }}>
          <video
            ref={videoRef}
            data-tatame-video
            src={near ? source.src : undefined}
            poster={source.poster}
            muted
            loop
            playsInline
            preload={near ? "auto" : "none"}
            controls={isStatic}
            aria-label="Treino na Black Wave: mãos na gola, pés no tatame, faixa sendo amarrada"
            className="h-full w-full object-cover"
          />
          {/* Vinheta para a frase ficar legível sobre o vídeo */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        {/* Legenda da janela + dica de rolagem */}
        {!isStatic && (
          <div
            data-tatame-caption
            className="absolute inset-x-0 top-[calc(76%+1.25rem)] flex flex-col items-center gap-4 text-center text-[length:var(--fs-label)] uppercase tracking-[0.32em]"
          >
            <p className="text-paper/70">O que acontece nas profundezas.</p>
            <p className="flex items-center gap-3 text-paper/80">
              {/* Cantos que se abrem: a janela vai virar tela cheia */}
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="tatame-expand text-accent">
                <path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              Role para ver em tela cheia
            </p>
          </div>
        )}

        {/* Frase de tela cheia + ações */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-8 px-[var(--gutter)] pb-[clamp(2rem,8vh,5rem)] lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="tatame-titulo"
            data-tatame-title
            className="max-w-[12ch] font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
          >
            Técnica, suor e constância.
          </h2>
          <div data-tatame-actions className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={withSound}
              className="flex items-center gap-3 text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/80 transition-colors hover:text-paper"
            >
              <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={"eq-bar w-[2px] bg-current " + (withSound ? "eq-bar--on" : "")}
                    style={{ animationDelay: `${i * -0.23}s` }}
                  />
                ))}
              </span>
              {withSound ? "Silenciar vídeo" : "Assistir com som"}
            </button>
            <a
              href="#modalidades"
              onClick={(e) => {
                e.preventDefault()
                goToSection("modalidades")
              }}
              className="group inline-flex items-center gap-4 border border-paper/40 px-5 py-4 text-xs uppercase tracking-[0.18em] transition-colors duration-300 hover:border-accent hover:bg-accent sm:px-7 sm:text-sm sm:tracking-[0.24em]"
            >
              Escolha sua modalidade
              <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-1">
                <path d="M6 0v14M1 9l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
