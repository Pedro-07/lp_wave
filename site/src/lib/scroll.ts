import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(ScrollTrigger, SplitText)

let lenis: Lenis | null = null
let locked = false
let locks = 0

export function initScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null
  lenis = new Lenis({ lerp: 0.1 })
  if (locked) lenis.stop()
  lenis.on("scroll", ScrollTrigger.update)
  const tick = (t: number) => lenis?.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  document.fonts.ready.then(() => ScrollTrigger.refresh())
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

/** Leva a página a y (via Lenis quando ativo). immediate = sem animação. */
export function scrollToY(y: number, immediate = true) {
  // A página pode ter crescido há pouco (seções montadas depois do hero):
  // o Lenis precisa da altura nova, senão limita o destino à altura antiga.
  lenis?.resize()
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1, force: true })
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" })
}

/** Leva a página ao início de uma seção (pelo id). false = seção ainda não existe. */
export function scrollToSection(id: string, immediate = true) {
  const el = document.getElementById(id)
  if (!el) return false
  scrollToY(el.getBoundingClientRect().top + window.scrollY, immediate)
  return true
}

/** Trava/destrava a rolagem da página (usado pela gaveta e pelo menu). */
export function setScrollLocked(value: boolean) {
  // Contador: menu e gaveta podem se sobrepor (CTA do menu abre a gaveta);
  // a página só destrava quando o último deles fechar.
  locks = Math.max(0, locks + (value ? 1 : -1))
  locked = locks > 0
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.style.overflow = locked ? "hidden" : ""
}

export { gsap, ScrollTrigger, SplitText }
