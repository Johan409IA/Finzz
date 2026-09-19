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
  alimentacion: 'bg-emerald-100 text-emerald-800',
  transporte: 'bg-sky-100 text-sky-800',
  vivienda: 'bg-amber-100 text-amber-800',
  servicios: 'bg-violet-100 text-violet-800',
  salud: 'bg-rose-100 text-rose-800',
  ocio: 'bg-fuchsia-100 text-fuchsia-800',
  educacion: 'bg-indigo-100 text-indigo-800',
  otros: 'bg-stone-200 text-stone-700',
}

const CATEGORY_BADGE_BASE =
  'inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold'

export function categoryBadgeClass(slug: string): string {
  return `${CATEGORY_BADGE_BASE} ${CATEGORY_BADGE_STYLES[slug] ?? 'bg-stone-200 text-stone-700'}`
}
