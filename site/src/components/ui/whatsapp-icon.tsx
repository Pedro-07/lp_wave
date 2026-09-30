/** Ícone de WhatsApp (balão com telefone), traço fino no estilo dos outros ícones do site. */
export function WhatsappIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3l-4.5 1.2z" strokeLinejoin="round" />
      <path
        d="M9 8.2c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .5.6 1 1.4 1.8 2.4 2.4.2.1.4.1.5 0l.6-.5c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.5-3.3-.4a9.5 9.5 0 0 1-3.8-3.8C8.5 9.8 8.7 8.8 9 8.2z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
