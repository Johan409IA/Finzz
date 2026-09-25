import type { JSX } from 'solid-js'
import BookOpen from 'lucide-solid/icons/book-open'
import Car from 'lucide-solid/icons/car'
import Gamepad2 from 'lucide-solid/icons/gamepad-2'
import HeartPulse from 'lucide-solid/icons/heart-pulse'
import House from 'lucide-solid/icons/house'
import ShoppingCart from 'lucide-solid/icons/shopping-cart'
import Utensils from 'lucide-solid/icons/utensils'
import Zap from 'lucide-solid/icons/zap'
import { categoryBadgeClass } from '../lib/history'

export function categoryIcon(slug: string, size = 16): JSX.Element {
  const props = { size, strokeWidth: 1.9, 'aria-hidden': 'true' as const }

  switch (slug) {
    case 'alimentacion':
      return <Utensils {...props} />
    case 'transporte':
      return <Car {...props} />
    case 'vivienda':
      return <House {...props} />
    case 'servicios':
      return <Zap {...props} />
    case 'salud':
      return <HeartPulse {...props} />
    case 'ocio':
      return <Gamepad2 {...props} />
    case 'educacion':
      return <BookOpen {...props} />
    default:
      return <ShoppingCart {...props} />
  }
}

interface CategoryBadgeProps {
  slug: string
  name: string
}

export default function CategoryBadge(props: CategoryBadgeProps) {
  return (
    <span class={categoryBadgeClass(props.slug)}>
      {categoryIcon(props.slug, 14)}
      <span class="overflow-hidden text-ellipsis whitespace-nowrap">{props.name}</span>
    </span>
  )
}
