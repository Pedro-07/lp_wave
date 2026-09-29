import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { OceanSound } from "@/lib/ocean-sound"
import { gsap, SplitText } from "@/lib/scroll"
import { CtaLink } from "./cta-link"
import { addSymbolDraw, SymbolDraw } from "./symbol-draw"

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

/** Distância de rolagem do hero fixado (curta = responde rápido). */
const PIN_DISTANCE = "+=120%"

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
        // O 1º quadro vem primeiro (é a primeira tela); os demais em seguida,
        // em ordem — o começo da onda já está pronto quando a pessoa rola.
        const images: HTMLImageElement[] = []
        const load = (i: number) => {
          const img = new Image()
          img.decoding = "async"
          img.onload = () => {
            if (i === current || !ready(images[current])) draw()
          }
          img.src = frameSrc(set.dir, i)
          images[i] = img
        }
        const ready = (img?: HTMLImageElement) => Boolean(img?.complete && img.naturalWidth)
        load(0)
        let restStarted = false
        const loadRest = () => {
          if (restStarted) return
          restStarted = true
          for (let i = 1; i < set.count; i++) load(i)
        }
        // Mas sem disputar banda com a primeira tela: espera o load da página,
        // a não ser que a pessoa toque/role antes disso.
        const INTENT = ["wheel", "touchstart", "keydown", "pointerdown"] as const
        INTENT.forEach((ev) => window.addEventListener(ev, loadRest, { once: true, passive: true }))
        const afterLoad = () => window.setTimeout(loadRest, 200)
        if (document.readyState === "complete") afterLoad()
        else window.addEventListener("load", afterLoad, { once: true })
        cleanups.push(() => {
          INTENT.forEach((ev) => window.removeEventListener(ev, loadRest))
          window.removeEventListener("load", afterLoad)
        })

        let current = 0
        const draw = () => {
          // Quadro pedido ainda não chegou? Mostra o carregado mais próximo antes dele.
          let k = current
          while (k > 0 && !ready(images[k])) k--
          const img = images[k]
          if (!ready(img)) return
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
        images[0].addEventListener("load", () => {
          setMediaReady(true)
          resize()
        })
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

      const endItems = q("[data-end-item]")
      const cta = q("[data-cta]")[0] as HTMLElement
      gsap.set(endItems, { autoAlpha: 0, y: 24, filter: "blur(8px)" })

      // ── Roteiro do scroll (duração total = 1) ───────────────────
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: PIN_DISTANCE,
          pin: true,
          scrub: 0.25,
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
      // No fim do roteiro o CTA acende (vermelho + pulso); volta ao rolar para cima.
      tl.eventCallback("onUpdate", () => {
        soundRef.current?.update(tl.progress())
        cta.classList.toggle("cta-live", tl.progress() > 0.97)
      })

      const proxy = { p: 0 }
      tl.to(proxy, { p: 1, duration: 0.6, onUpdate: () => render(proxy.p) }, 0)
      tl.to(q("[data-media]"), { scale: 1.06, duration: 0.6 }, 0)
      // A dica de rolagem nunca some (ninguém fica sem saber que precisa rolar):
      // "Role" no início, "Continue rolando" assim que a rolagem começa.
      tl.to(q("[data-hint-start]"), { autoAlpha: 0, duration: 0.03 }, 0.02)
      tl.fromTo(q("[data-hint-more]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.03)
      tl.to(q("[data-title]"), { autoAlpha: 0, y: -24, filter: "blur(10px)", duration: 0.25 }, 0)
      tl.to(q("[data-shade]"), { opacity: 0.92, duration: 0.16 }, 0.5)

      // Traço do símbolo: velocidade de caneta constante ao longo da linha.
      addSymbolDraw(tl, root, 0.58, 0.3)

      tl.to(endItems, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.1, stagger: 0.03, ease: "power2.out" }, 0.84)
      tl.fromTo(q("[data-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)

      // ── Botão magnético (só ponteiro fino) ──────────────────────
      if (mode === "video") {
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

  // ── Abertura (load) ──
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
        {/* O canto é do botão Menu (fixo, site-menu.tsx); o SOM fica logo abaixo dele. */}
        <div className="flex flex-col items-end pt-[clamp(2.25rem,4vw,3rem)]">
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
        São Luís — MA · Est. 2026
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

      {/* Fechamento: símbolo + naming + slogan + CTA. Larguras limitadas também
          pela altura (celular deitado) e respiro embaixo para a dica de rolagem. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[clamp(0.75rem,3vh,2.25rem)] px-[var(--gutter)] pb-[clamp(3.5rem,9vh,5rem)] pt-[clamp(1rem,4vh,3rem)] [&_a]:pointer-events-auto">
        <SymbolDraw complete={isStatic} className="w-[min(88vw,1080px,110svh)]" />
        <div data-end-item className="flex flex-col items-center gap-3">
          <img src="/brand/naming-white.webp" alt="Black Wave" width={1400} height={158} className="h-auto w-[min(70vw,560px,72svh)]" />
          <p className="pl-[0.6em] text-[length:var(--fs-label)] uppercase tracking-[0.6em] text-paper/70">Jiu Jitsu Team</p>
        </div>
        <img data-end-item src="/brand/slogan-white.webp" alt="Just Flow" width={1400} height={530} className="h-auto w-[min(46vw,240px,28svh)]" />
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
          <span className="grid justify-items-center whitespace-nowrap [&>*]:col-start-1 [&>*]:row-start-1">
            <span data-hint-start className="pl-[0.4em]">
              Role
            </span>
            <span data-hint-more aria-hidden="true" className="invisible pl-[0.4em] opacity-0">
              Continue rolando
            </span>
          </span>
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
