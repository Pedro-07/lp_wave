import { useEffect, useState } from "react"
import { whatsappLink } from "@/config"
import { WhatsappIcon } from "./whatsapp-icon"

// Barra de ação fixa: aula experimental + WhatsApp sempre a um toque.
// Celular: faixa no rodapé da tela, na zona do polegar. Desktop: bloco compacto
// no canto inferior direito. Aparece depois do hero (que já tem o CTA dele) e
// some no rodapé (onde os mesmos botões já estão) e enquanto uma seção de tela
// cheia com ações próprias está fixa (trilha da seção 2, vídeo e modalidades).

/** Seções fixas que já têm os próprios botões na base da tela. */
const OWN_ACTIONS = ["#perturbacao [data-stage]", "#tatame [data-tatame-stage]", "#modalidades [data-mods-stage]"]

export function ActionBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const vh = window.innerHeight
      const hero = document.getElementById("topo")
      // Hero fixado ainda na tela (o pin dele soma a altura extra ao spacer).
      const heroEnd = hero ? (hero.closest(".pin-spacer") ?? hero).getBoundingClientRect().bottom : 0
      const pastHero = heroEnd < vh * 0.4
      const footer = document.querySelector("footer")
      const atFooter = footer ? footer.getBoundingClientRect().top < vh * 0.85 : false
      const inOwn = OWN_ACTIONS.some((sel) => {
        const r = document.querySelector(sel)?.getBoundingClientRect()
        return r ? r.top <= 1 && r.bottom >= vh - 1 : false
      })
      setVisible(pastHero && !atFooter && !inOwn)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      data-action-bar
      aria-hidden={!visible}
      inert={!visible}
      className={
        "fixed z-50 flex transition-[transform,opacity] duration-500 ease-[var(--ease-out)] " +
        // celular: faixa inteira no rodapé; desktop: bloco no canto
        "inset-x-0 bottom-0 gap-2 border-t border-paper/15 bg-ink/90 px-[var(--gutter)] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md " +
        "md:inset-x-auto md:right-[var(--gutter)] md:bottom-[clamp(1rem,2.5vw,2rem)] md:gap-0 md:border md:p-0 md:backdrop-blur-none " +
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 md:translate-y-4")
      }
    >
      <a
        href="#aula-experimental"
        className="group flex flex-1 items-center justify-center gap-3 bg-accent px-5 py-3.5 text-xs uppercase tracking-[0.18em] text-paper transition-colors duration-300 hover:bg-paper hover:text-ink sm:text-sm md:flex-none md:px-6 md:py-4"
      >
        <span>
          <span className="max-sm:hidden">Agendar aula experimental</span>
          <span className="sm:hidden">Aula experimental</span>
        </span>
        <svg width="16" height="11" viewBox="0 0 18 12" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </a>
      <a
        href={whatsappLink("Olá, Black Wave! Vim pelo site e queria mais informações.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="grid w-14 shrink-0 place-items-center border border-paper/30 text-paper transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-ink md:w-auto md:border-0 md:border-l md:bg-ink md:px-5"
      >
        <WhatsappIcon size={22} />
      </a>
    </div>
  )
}
