import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(ScrollTrigger, SplitText)

export function initScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null
  const lenis = new Lenis({ lerp: 0.1 })
  lenis.on("scroll", ScrollTrigger.update)
  const tick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  document.fonts.ready.then(() => ScrollTrigger.refresh())
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
  }
}

export { gsap, ScrollTrigger, SplitText }
