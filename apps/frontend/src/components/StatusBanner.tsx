import type { JSX } from 'solid-js'

interface StatusBannerProps {
  tone: 'success' | 'danger'
  children: JSX.Element
}

export default function StatusBanner(props: StatusBannerProps) {
  const toneClass = () =>
    props.tone === 'success'
      ? 'border-finzz-accent-border/60 bg-finzz-accent-bg text-finzz-success'
      : 'border-finzz-danger-border bg-finzz-danger-bg text-finzz-danger'

  return (
    <p
      class={`m-0 rounded-xl border px-4 py-3 text-sm lg:shrink-0 ${toneClass()}`}
      role={props.tone === 'success' ? 'status' : 'alert'}
    >
      {props.children}
    </p>
  )
}
