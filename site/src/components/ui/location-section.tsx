import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "@/lib/scroll"
import { whatsappLink } from "@/config"

// Seção 9 — Onde estamos (SPEC.md §4). Endereço e horários [PREENCHER].
// Mapa do Google em P&B escuro (filtro CSS) e carregado só perto da tela.

/** [PREENCHER] endereço completo; enquanto vazio, mapa e rota apontam para São Luís. */
const ENDERECO = ""
const MAPS_QUERY = ENDERECO || "São Luís, MA"

export function LocationSection() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope.current)
        gsap.fromTo(
          q("[data-city]"),
          { xPercent: 2 },
          { xPercent: -2, ease: "none", scrollTrigger: { trigger: scope.current, start: "top bottom", end: "bottom top", scrub: true } },
        )
        gsap.from(q("[data-loc-rise]"), {
          y: 24,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: scope.current, start: "top 65%" },
        })
      })
    },
    { scope },
  )

  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/60"

  return (
    <section
      ref={scope}
      id="onde-estamos"
      aria-labelledby="onde-titulo"
      className="relative overflow-hidden border-t border-paper/10 bg-ink py-[var(--space-section)] text-paper"
    >
      <p className={label + " mb-6 px-[var(--gutter)]"}>
        <span className="text-accent">09</span> — Onde estamos
      </p>
      <h2 id="onde-titulo" className="sr-only">
        Onde estamos: São Luís, Maranhão
      </h2>
      <p
        data-city
        aria-hidden="true"
        className="city-word px-[var(--gutter)] font-display text-[clamp(4.5rem,18vw,8rem)] leading-[0.85] font-extrabold uppercase sm:whitespace-nowrap sm:text-[clamp(5rem,11.5vw,15rem)]"
      >
        São Luís <span className="city-word--solid block sm:inline">— MA</span>
      </p>

      <div className="mt-[clamp(2.5rem,6vw,5rem)] grid gap-10 px-[var(--gutter)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <dl data-loc-rise className="grid gap-6">
            <div>
              <dt className={label}>Endereço</dt>
              <dd className="mt-2 text-[length:var(--fs-body)] leading-relaxed">{ENDERECO || "[PREENCHER]"}</dd>
            </div>
            <div>
              <dt className={label}>Horários</dt>
              <dd className="mt-2 text-[length:var(--fs-body)] leading-relaxed">[PREENCHER]</dd>
            </div>
          </dl>
          <div data-loc-rise className="flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Black Wave Jiu Jitsu ${MAPS_QUERY}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-4 bg-paper px-6 py-4 text-sm uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-paper"
            >
              Como chegar
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </a>
            <a
              href={whatsappLink("Olá, Black Wave! Queria saber o endereço e os horários de treino.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 border border-paper/40 px-6 py-4 text-sm uppercase tracking-[0.2em] transition-colors duration-300 hover:border-accent hover:bg-accent"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </div>

        <div data-loc-rise className="relative aspect-[4/3] overflow-hidden border border-paper/15 lg:col-span-7">
          <iframe
            title="Mapa: Black Wave em São Luís, MA"
            src={`https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&z=13&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="map-dark h-full w-full"
          />
        </div>
      </div>
    </section>
  )
}
