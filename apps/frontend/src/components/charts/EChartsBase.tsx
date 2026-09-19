import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([BarChart, LineChart, PieChart, GridComponent, TitleComponent, TooltipComponent, CanvasRenderer])

interface EChartsBaseProps {
  option: EChartsCoreOption
  label: string
  height?: number
}

function isCanvasSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext?.('2d')
  } catch {
    return false
  }
}

export default function EChartsBase(props: EChartsBaseProps) {
  let container: HTMLDivElement | undefined
  let chart: echarts.ECharts | undefined
  let observer: ResizeObserver | undefined
  const [unavailable, setUnavailable] = createSignal(false)

  onMount(() => {
    if (!container || !isCanvasSupported()) {
      setUnavailable(true)
      return
    }
    try {
      chart = echarts.init(container)
      chart.setOption(props.option, { notMerge: false })
      if (typeof ResizeObserver !== 'undefined') {
        const current = chart
        observer = new ResizeObserver(() => current.resize())
        observer.observe(container)
      } else {
        const onResize = () => chart?.resize()
        window.addEventListener('resize', onResize)
        onCleanup(() => window.removeEventListener('resize', onResize))
      }
    } catch {
      chart?.dispose()
      chart = undefined
      setUnavailable(true)
    }
  })

  createEffect(() => {
    // Suscribe a cambios de la opción sin recrear la instancia.
    const next = props.option
    if (chart) chart.setOption(next, { notMerge: false })
  })

  onCleanup(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = undefined
  })

  return (
    <div
      ref={container}
      role="img"
      aria-label={props.label}
      style={{ width: '100%', height: `${props.height ?? 260}px` }}
    >
      <Show when={unavailable()}>
        <p class="py-8 text-center text-sm text-finzz-text">Gráfico no disponible en este entorno.</p>
      </Show>
    </div>
  )
}
