import { scrollToY } from "@/lib/scroll"
import { WHATSAPP_DISPLAY, whatsappLink } from "@/config"
import symbol from "./symbol-draw.json"

// Seção 10 — Rodapé (SPEC.md §4). Selo circular girando (do patch da marca),
// links, contato e créditos.

const LINKS = [
  { href: "#modalidades", label: "Modalidades" },
  { href: "#gear", label: "Gear" },
  { href: "#vozes", label: "Vozes do tatame" },
  { href: "/ouvidoria/", label: "Ouvidoria" },
]

/** Selo do patch: símbolo no centro e texto correndo em volta. */
function Seal() {
  return (
    <a href="#aula-experimental" aria-label="Agendar aula experimental" className="group relative block size-[clamp(9rem,16vw,12rem)] shrink-0">
      <svg viewBox="0 0 200 200" className="seal-spin absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="seal-circle" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text className="fill-paper/70 text-[13px] tracking-[0.32em] uppercase">
          <textPath href="#seal-circle">Black Wave · Brazilian Jiu Jitsu · Just Flow ·</textPath>
        </text>
      </svg>
      <svg viewBox={symbol.viewBox} className="absolute top-1/2 left-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        <path d={symbol.black} fill="var(--paper)" fillRule="evenodd" />
        <path d={symbol.red} fill="var(--accent-logo)" />
      </svg>
      <span className="absolute inset-[18%] rounded-full border border-paper/15 transition-colors duration-300 group-hover:border-accent" />
    </a>
  )
}

export function SiteFooter() {
  const label = "text-[length:var(--fs-label)] uppercase tracking-[0.32em] text-paper/50"
  const link = "text-[length:var(--fs-body)] text-paper/80 transition-colors hover:text-paper"

  return (
    <footer className="relative border-t border-paper/10 bg-ink px-[var(--gutter)] pt-[clamp(4rem,10vw,8rem)] pb-[clamp(1.5rem,4vw,2.5rem)] text-paper">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <img src="/brand/naming-white.webp" alt="Black Wave" className="w-[min(70vw,22rem)]" loading="lazy" />
          <p className={label}>Jiu Jitsu Team · São Luís — MA</p>
          <Seal />
        </div>

        <nav aria-label="Rodapé" className="lg:col-span-3">
          <p className={label + " mb-5"}>Site</p>
          <ul className="grid gap-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={link}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className={label + " mb-5"}>Contato</p>
          <ul className="grid gap-3">
            <li>
              <a href={whatsappLink("Olá, Black Wave!")} target="_blank" rel="noopener noreferrer" className={link}>
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="text-[length:var(--fs-body)] text-paper/50">Instagram [PREENCHER]</li>
            <li>
              <a href="#aula-experimental" className={link + " inline-flex items-center gap-3"}>
                Agendar aula experimental <span className="text-accent">→</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-[clamp(3rem,8vw,6rem)] flex flex-col gap-4 border-t border-paper/10 pt-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Black Wave Jiu Jitsu Team — São Luís, MA</p>
        <p>Identidade visual: Double Ace [CONFIRMAR]</p>
        <button type="button" onClick={() => scrollToY(0, false)} className="self-start uppercase tracking-[0.28em] transition-colors hover:text-paper sm:self-auto">
          Voltar ao topo ↑
        </button>
      </div>
    </footer>
  )
}
