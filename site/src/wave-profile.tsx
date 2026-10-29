import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { WaveProfilePage } from "@/components/ui/wave-profile-page"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WaveProfilePage />
  </StrictMode>,
)
