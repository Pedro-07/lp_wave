import { useEffect } from "react"
import { ClosingSection } from "@/components/ui/closing-section"
import { GearSection } from "@/components/ui/gear-section"
import { LocationSection } from "@/components/ui/location-section"
import { ModalitiesSection } from "@/components/ui/modalities-section"
import { OuvidoriaSection } from "@/components/ui/ouvidoria-section"
import { PerturbationSection } from "@/components/ui/perturbation-section"
import { SiteFooter } from "@/components/ui/site-footer"
import { TestimonialsSection } from "@/components/ui/testimonials-section"
import { TrainingVideoSection } from "@/components/ui/training-video-section"
import { enqueueIdle } from "@/lib/idle"
import { scrollToY } from "@/lib/scroll"

// Tudo abaixo do hero, num pedaço de código separado: é baixado e renderizado
// logo depois da primeira tela (App.tsx), para o hero aparecer rápido no celular.

export default function BelowFold() {
  // Link direto para uma seção (ex.: /#kimonos): ela só existe agora, então rola
  // até ela depois que as animações das seções estiverem montadas.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1))
    if (!id || id === "aula-experimental") return
    enqueueIdle(() => {
      const el = document.getElementById(id)
      if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY)
    })
  }, [])

  return (
    <>
      <PerturbationSection />
      <TrainingVideoSection />
      <ModalitiesSection />
      <GearSection />
      <TestimonialsSection />
      <OuvidoriaSection />
      <ClosingSection />
      <LocationSection />
    </>
  )
}

export { SiteFooter }
