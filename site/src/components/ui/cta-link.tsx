import type { AnchorHTMLAttributes } from "react"

// CTA principal do site ("Agendar aula experimental"). Mesmo desenho em
// todas as seções; data-attributes extras passam direto para o <a>.
export function CtaLink({ className = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      className={
        "group inline-flex items-center gap-4 whitespace-nowrap border border-paper/40 px-5 py-4 text-xs uppercase tracking-[0.18em] transition-colors duration-300 hover:border-accent hover:bg-accent sm:px-7 sm:text-sm sm:tracking-[0.24em] " +
        className
      }
    >
      {children}
      <svg
        width="18"
        height="12"
        viewBox="0 0 18 12"
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1"
      >
        <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </a>
  )
}
