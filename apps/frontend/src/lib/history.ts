export function getVisiblePageNumbers(current: number, total: number, max = 5): number[] {
  if (total <= 1) return [1]
  const size = Math.min(max, total)
  let start = current - Math.floor(size / 2)
  start = Math.max(1, Math.min(start, total - size + 1))
  return Array.from({ length: size }, (_, index) => start + index)
}

export function formatShowingRange(page: number, limit: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 }
  return { from: (page - 1) * limit + 1, to: Math.min(page * limit, total) }
}

export function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase()
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  alimentacion: 'border-emerald-400/40 bg-emerald-400/12 text-emerald-300',
  transporte: 'border-sky-400/40 bg-sky-400/12 text-sky-300',
  vivienda: 'border-amber-400/40 bg-amber-400/12 text-amber-300',
  servicios: 'border-violet-400/40 bg-violet-400/12 text-violet-300',
  salud: 'border-rose-400/40 bg-rose-400/12 text-rose-300',
  ocio: 'border-fuchsia-400/40 bg-fuchsia-400/12 text-fuchsia-300',
  educacion: 'border-indigo-400/40 bg-indigo-400/12 text-indigo-300',
  otros: 'border-stone-400/40 bg-stone-400/12 text-stone-300',
}

const CATEGORY_BADGE_BASE =
  'inline-flex max-w-full items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold'

export function categoryBadgeClass(slug: string): string {
  return `${CATEGORY_BADGE_BASE} ${CATEGORY_BADGE_STYLES[slug] ?? 'border-stone-400/40 bg-stone-400/12 text-stone-300'}`
}
