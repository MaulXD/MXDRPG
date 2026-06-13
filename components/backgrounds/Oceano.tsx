'use client'
import { useEffect, useRef } from 'react'

export default function Oceano() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0

    const waves = Array.from({ length: 12 }, (_, i) => ({
      y: 0.25 + i * 0.06,
      freq: 0.012 - i * 0.001,
      ph: i * 0.5,
      speed: 0.4 + i * 0.1,
      amp: 4 + i * 1.5,
    }))

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100) }
    window.addEventListener('resize', onResize)

    function frame() {
      t += 0.008
      const W = canvas!.width, H = canvas!.height
      ctx.fillStyle = '#020810'
      ctx.fillRect(0, 0, W, H)

      const dg = ctx.createLinearGradient(0, 0, 0, H)
      dg.addColorStop(0, 'rgba(5,20,50,0.3)')
      dg.addColorStop(1, 'rgba(2,10,30,0.5)')
      ctx.fillStyle = dg
      ctx.fillRect(0, 0, W, H)

      waves.forEach((w, i) => {
        const a = 0.03 + 0.02 * (1 - i / 12)
        ctx.strokeStyle = `rgba(40,100,180,${a + 0.01 * Math.sin(t * 0.5 + i)})`
        ctx.lineWidth = 0.7
        ctx.beginPath()
        for (let x = 0; x <= W; x += 3) {
          const y = w.y * H + Math.sin(x * w.freq + t * w.speed + w.ph) * w.amp
            + Math.sin(x * (w.freq * 0.6) - t * 0.25 + w.ph) * 2.5
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(1,4,10,0.9)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)

      rafId = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}
