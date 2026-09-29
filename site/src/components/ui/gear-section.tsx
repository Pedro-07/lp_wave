import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import { gsap, ScrollTrigger, SplitText } from "@/lib/scroll"
import { whatsappLink } from "@/config"
import { Viewer360 } from "./viewer-360"

// Seção 5 — Gear (SPEC.md §4). Divisória "GEAR" com texto corrido do patch
// e, em seguida, o kimono em 360° (wow nº 3): Basic/Premium × Branco/Preto.
// A venda é concluída no WhatsApp com a mensagem pronta.

type Modelo = "Basic" | "Premium"
type Cor = "Branco" | "Preto"

const FRAMES = 72

const MODELOS: Record<Modelo, { desc: string }> = {
  Basic: { desc: "Linha essencial para treinos regulares." },
  Premium: {
    desc: "Feito com fornecedores nacionais de referência. Tecido de alta resistência, acabamento superior e durabilidade para treino intenso e competição.",
  },
}

const MARQUEE = "BLACK WAVE BRAZILIAN JIU JITSU"

export function GearSection() {
  const scope = useRef<HTMLElement>(null)
  const [modelo, setModelo] = useState<Modelo>("Premium")
  const [cor, setCor] = useState<Cor>("Preto")
  const dir = `/gear/${modelo.toLowerCase()}-${cor === "Branco" ? "branco" : "preto"}`
  const tagTone = cor === "Branco" ? "branca" : "preta"

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)

        // Divisória: GEAR desliza com a rolagem; o texto corrido anda sempre e
        // acelera com a velocidade da rolagem.
        gsap.fromTo(
          q("[data-gear-word]"),
          { xPercent: 12 },
          {
            xPercent: -12,
            ease: "none",
            scrollTrigger: { trigger: q("[data-gear-divider]")[0], start: "top bottom", end: "bottom top", scrub: true },
          },
        )
        const marquee = gsap.to(q("[data-marquee-track]"), { xPercent: -50, duration: 28, ease: "none", repeat: -1 })
        ScrollTrigger.create({
          trigger: q("[data-gear-divider]")[0],
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 400)
            gsap.to(marquee, { timeScale: boost, duration: 0.3, overwrite: true })
            gsap.to(marquee, { timeScale: 1, duration: 1.2, delay: 0.3 })
          },
        })

        const words = SplitText.create(q("[data-gear-title]")[0], { type: "words" }).words
        gsap.from(words, {
          yPercent: 60,
          autoAlpha: 0,
          filter: "blur(10px)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: q("[data-gear-title]")[0], start: "top 80%" },
        })
        gsap.from(q("[data-gear-info] > *"), {
          y: 24,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: q("[data-gear-info]")[0], start: "top 80%" },
        })
      })
    },
    { scope },
  )

  const message = `Olá, Black Wave! Tenho interesse no Kimono ${modelo} ${cor.toLowerCase()}. Pode me passar tamanhos e valores?`
  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"
  const option = (on: boolean) =>
    "px-5 py-3 text-sm uppercase tracking-[0.18em] transition-colors duration-300 " +
    (on ? "bg-paper text-ink" : "text-paper/70 hover:text-paper")

  return (
    <section ref={scope} id="gear" aria-labelledby="gear-titulo" className="relative bg-ink text-paper">
      {/* Divisória */}
      <div data-gear-divider aria-hidden="true" className="relative overflow-hidden border-y border-paper/10 py-[clamp(2rem,6vw,5rem)]">
        <p
          data-gear-word
          className="gear-word text-center font-display text-[clamp(7rem,30vw,28rem)] leading-[0.8] font-extrabold uppercase"
        >
          Gear
        </p>
        <div className="absolute inset-x-0 bottom-[clamp(1rem,3vw,2.5rem)] overflow-hidden">
          <div data-marquee-track className="flex w-max text-[length:var(--fs-label)] tracking-[0.5em] text-paper/60">
            {Array.from({ length: 2 }, (_, k) => (
              <span key={k} className="flex shrink-0">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="px-6">
                    {MARQUEE} <span className="text-accent">·</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-[var(--gutter)] pt-[clamp(4rem,10vw,8rem)] pb-[var(--space-section)]">
        <p className={label + " mb-6"}>
          <span className="text-accent">05</span> — Gear
        </p>
        <h2
          id="gear-titulo"
          data-gear-title
          className="font-display text-[length:var(--fs-list)] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
        >
          Vista a onda.
        </h2>

        <div className="mt-[clamp(2rem,5vw,4rem)] grid gap-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          {/* 360° */}
          <div className="relative lg:col-span-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,0.03),transparent_60%)]"
            />
            <Viewer360
              dir={dir}
              count={FRAMES}
              label={`Kimono ${modelo} ${cor.toLowerCase()} em 360 graus`}
              className="mx-auto h-[min(78svh,52rem)] w-full max-w-[34rem]"
            />
          </div>

          {/* Produto */}
          <div data-gear-info className="flex flex-col gap-8 lg:col-span-5 lg:self-center">
            <div role="tablist" aria-label="Modelo" className="inline-flex self-start border border-paper/25">
              {(Object.keys(MODELOS) as Modelo[]).map((m) => (
                <button key={m} role="tab" aria-selected={modelo === m} type="button" onClick={() => setModelo(m)} className={option(modelo === m)}>
                  {m}
                </button>
              ))}
            </div>

            <div>
              <h3 className="font-display text-[length:var(--fs-h2)] font-extrabold uppercase leading-[0.95]">Kimono {modelo}</h3>
              <p className="mt-4 max-w-[40ch] text-[length:var(--fs-body)] leading-relaxed text-paper/75">{MODELOS[modelo].desc}</p>
            </div>

            <fieldset>
              <legend className={label}>Cor — {cor}</legend>
              <div className="mt-4 flex gap-3">
                {(["Preto", "Branco"] as Cor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    aria-pressed={cor === c}
                    aria-label={c}
                    className={
                      "size-11 rounded-full ring-offset-4 ring-offset-ink transition-shadow " +
                      (c === "Preto" ? "bg-[#111] ring-1 ring-paper/40 " : "bg-paper ") +
                      (cor === c ? "ring-2 ring-accent" : "")
                    }
                  />
                ))}
              </div>
            </fieldset>

            <dl className="grid gap-2 text-sm text-paper/70">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-[length:var(--fs-label)] uppercase tracking-[0.24em] text-paper/50">Tamanhos</dt>
                <dd>[CONFIRMAR]</dd>
              </div>
            </dl>

            {/* Detalhes: etiquetas reais da marca (brand/tags) */}
            <div>
              <p className={label}>Detalhes</p>
              <div className="mt-4 flex gap-3">
                {[
                  { src: `/gear/tags/gola-${tagTone}.webp`, alt: "Etiqueta da gola: Black Wave, Brazilian Jiu Jitsu, 2026", cap: "Etiqueta da gola" },
                  { src: `/gear/tags/patch-${tagTone}.webp`, alt: "Patch com o símbolo Black Wave e texto circular", cap: "Patch" },
                ].map((d) => (
                  <figure key={d.cap} className="w-28">
                    <div className="grid aspect-square place-items-center overflow-hidden border border-paper/15 bg-paper/5 p-2">
                      <img src={d.src} alt={d.alt} loading="lazy" className="max-h-full transition-transform duration-500 hover:scale-110" />
                    </div>
                    <figcaption className="mt-2 text-xs text-paper/50">{d.cap}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-between gap-4 self-start bg-paper px-7 py-5 text-sm uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper"
            >
              Quero este kimono
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </a>
            <p className="-mt-4 text-xs text-paper/50">A compra é finalizada no WhatsApp da equipe.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
