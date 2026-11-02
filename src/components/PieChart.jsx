import { useEffect, useRef } from 'react'
import { fmtMoney } from '../utils.js'

export default function PieChart({ slices }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 4
    const css = getComputedStyle(document.documentElement)
    const raised = css.getPropertyValue('--paper-raised').trim() || '#fff'
    const ink = css.getPropertyValue('--ink').trim() || '#1E2A38'

    ctx.clearRect(0, 0, size, size)
    const total = slices.reduce((s, x) => s + x.value, 0)

    if (total <= 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#EFE9DA'
      ctx.fill()
      ctx.fillStyle = '#8A9AAC'
      ctx.font = '13px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No expenses yet', cx, cy + 4)
      return
    }

    let start = -Math.PI / 2
    slices.forEach((s) => {
      const angle = (s.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = s.color
      ctx.fill()
      start += angle
    })
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2)
    ctx.fillStyle = raised
    ctx.fill()
    ctx.fillStyle = ink
    ctx.font = '600 15px Lora, serif'
    ctx.textAlign = 'center'
    ctx.fillText(fmtMoney(total), cx, cy + 3)
    ctx.font = '11px Inter, sans-serif'
    ctx.fillStyle = '#8A9AAC'
    ctx.fillText('total spent', cx, cy + 18)
  }, [slices])

  const total = slices.reduce((s, x) => s + x.value, 0)

  return (
    <div className="chart-wrap">
      <canvas ref={ref} width={170} height={170} />
      <div className="legend">
        {total <= 0 ? (
          <div className="muted">Nothing to show this month.</div>
        ) : (
          slices.map((s) => (
            <div className="row" key={s.name}>
              <span className="sw" style={{ background: s.color }} />
              <span>
                {s.name} — {fmtMoney(s.value)} ({Math.round((s.value / total) * 100)}%)
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
