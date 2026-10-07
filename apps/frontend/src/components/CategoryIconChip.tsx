import { categoryIcon } from './CategoryBadge'
import { categoryChartColor } from '../lib/charts'

const chipSizeClass = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
} as const

interface CategoryIconChipProps {
  slug: string
  size?: keyof typeof chipSizeClass
}

export default function CategoryIconChip(props: CategoryIconChipProps) {
  return (
    <span
      aria-hidden="true"
      class={`grid ${chipSizeClass[props.size ?? 'md']} shrink-0 place-items-center rounded-lg border border-finzz-border/70 bg-finzz-code/70`}
      style={{ color: categoryChartColor(props.slug) }}
    >
      {categoryIcon(props.slug, 16)}
    </span>
  )
}
