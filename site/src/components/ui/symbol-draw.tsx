import { useId } from "react"
import symbol from "./symbol-draw.json"

// Símbolo Black Wave vetorizado a partir de brand/logo/simbolo-black.png.
// O desenho é revelado por uma máscara: cada segmento da linha central
// ("caneta") tem a largura da espessura local do traço, então dá para
// animar strokeDashoffset segmento a segmento sem revelar partes vizinhas.
// Os elementos animáveis levam data-pen="main" | "branch" e data-len.

export const SYMBOL_BRANCH_AT = symbol.branchAt
export const SYMBOL_MAIN_LENGTH = symbol.main.reduce((sum, s) => sum + s.len, 0)

interface SymbolDrawProps {
  className?: string
  /** Mostra o símbolo inteiro, sem animação (reduced motion). */
  complete?: boolean
  title?: string
}

export function SymbolDraw({ className, complete = false, title = "Símbolo Black Wave" }: SymbolDrawProps) {
  const maskId = `bw-mask-${useId().replace(/:/g, "")}`

  const pen = (kind: "main" | "branch") => (s: { d: string; w: number; len: number }, i: number) => (
    <path
      key={`${kind}-${i}`}
      data-pen={kind}
      data-len={s.len}
      d={s.d}
      fill="none"
      stroke="#fff"
      strokeWidth={s.w}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${s.len} ${s.len + 200}`}
      strokeDashoffset={complete ? 0 : s.len}
      style={{ opacity: complete ? 1 : 0 }}
    />
  )

  return (
    <svg className={className} viewBox={symbol.viewBox} role="img" aria-label={title}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-100" y="-100" width="2600" height="730">
          {symbol.main.map(pen("main"))}
          {symbol.branch.map(pen("branch"))}
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path fill="var(--paper)" fillRule="evenodd" d={symbol.black} />
        <path fill="var(--accent-logo)" d={symbol.red} />
      </g>
    </svg>
  )
}
