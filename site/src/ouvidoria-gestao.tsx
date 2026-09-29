import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { OuvidoriaAdmin } from "@/components/ui/ouvidoria-admin"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OuvidoriaAdmin />
  </StrictMode>,
)
