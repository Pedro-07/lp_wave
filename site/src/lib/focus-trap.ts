// Mantém o Tab dentro de um diálogo modal (aria-modal) enquanto ele está aberto.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function trapFocus(container: HTMLElement) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return
    const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]'),
    )
    if (!items.length) {
      e.preventDefault()
      container.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !container.contains(active))) {
      e.preventDefault()
      first.focus()
    }
  }
  document.addEventListener("keydown", onKey, true)
  return () => document.removeEventListener("keydown", onKey, true)
}
