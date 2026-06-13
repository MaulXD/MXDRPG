'use client'
import { useEffect, useRef } from 'react'

export default function NevoaRoxa() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0

    type Blob = { x: number; y: number; rx: number; ry: number; ph: number; dx: number; col: string }
    const blobs: Blob[] = Array.from({ length: 5 }, (_, i) => ({
      x: 0.1 + i * 0.2,
      y: 0.2 + Math.random() * 0.6,
      rx: 0.22 + Math.random() * 0.2,
      ry: 0.14 + Math.random() * 0.12,
      ph: i * 1.2,
      dx: 0.00009 + i * 0.00003,
      col: i % 2 ? '55,25,115' : '25,15,80',
    }))

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100) }
    window.addEventListener('resize', onResize)

    function vignette(W: number, H: number) {
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(3,2,8,0.88)')
      ctx.globalAlpha = 1
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)
    }

    function frame() {
      t += 0.008
      const W = canvas!.width, H = canvas!.height
      ctx.fillStyle = '#060410'
      ctx.fillRect(0, 0, W, H)
      blobs.forEach(b => {
        b.x += b.dx
        if (b.x - b.rx > 1) b.x = -b.rx
        const p = 0.07 + 0.02 * Math.sin(t * 0.3 + b.ph)
        const g = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.rx * W)
        g.addColorStop(0, `rgba(${b.col},${p})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(b.x * W, b.y * H, b.rx * W, b.ry * H, 0, 0, Math.PI * 2)
        ctx.fill()
      })
      vignette(W, H)
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
