import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { OuvidoriaPage } from "@/components/ui/ouvidoria-page"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OuvidoriaPage />
  </StrictMode>,
)
