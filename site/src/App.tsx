import { lazy, Suspense, useEffect } from "react"
import { BookingProvider } from "@/components/ui/booking-drawer"
import { ActionBar } from "@/components/ui/action-bar"
import { SiteMenu } from "@/components/ui/site-menu"
import { WaveHero } from "@/components/ui/wave-hero"
import { useIdleReady } from "@/lib/idle"
import { initScroll } from "@/lib/scroll"

// O hero vem no carregamento; o resto (below-fold.tsx) é outro pedaço de código,
// baixado e renderizado no primeiro momento ocioso depois da primeira tela.
const BelowFold = lazy(() => import("./below-fold"))
const SiteFooter = lazy(() => import("./below-fold").then((m) => ({ default: m.SiteFooter })))

export default function App() {
  useEffect(() => initScroll() ?? undefined, [])
  const rest = useIdleReady()

  return (
    <BookingProvider>
      <SiteMenu />
      <ActionBar />
      <main className="grain">
        <WaveHero />
        {rest && (
          <Suspense fallback={null}>
            <BelowFold />
          </Suspense>
        )}
      </main>
      {rest && (
        <Suspense fallback={null}>
          <SiteFooter />
        </Suspense>
      )}
    </BookingProvider>
  )
}
