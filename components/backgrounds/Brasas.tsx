'use client'
import { useEffect, useRef } from 'react'

export default function Brasas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0

    const embers = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: 0.5 + Math.random() * 0.5,
      vy: 0.0012 + Math.random() * 0.0015,
      vx: (Math.random() - 0.5) * 0.0004,
      life: Math.random(),
      ph: Math.random() * Math.PI * 2,
      r: 0.6 + Math.random() * 1.2,
      hot: Math.random() < 0.3,
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
      ctx.fillStyle = '#090603'
      ctx.fillRect(0, 0, W, H)

      embers.forEach(e => {
        e.y -= e.vy
        e.x += e.vx + Math.sin(t * 1.5 + e.ph) * 0.0003
        e.life -= 0.003
        if (e.life <= 0 || e.y < 0) {
          e.x = Math.random(); e.y = 1; e.life = 0.5 + Math.random() * 0.5
        }
        ctx.globalAlpha = e.life * 0.75
        ctx.fillStyle = e.hot ? `rgb(255,${80 + Math.floor(e.life * 80)},10)` : '#888'
        ctx.beginPath()
        ctx.arc(e.x * W, e.y * H, e.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      const hg = ctx.createLinearGradient(0, H * 0.65, 0, H)
      hg.addColorStop(0, 'rgba(0,0,0,0)')
      hg.addColorStop(1, 'rgba(30,10,2,0.25)')
      ctx.fillStyle = hg
      ctx.fillRect(0, 0, W, H)

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(4,2,1,0.9)')
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
