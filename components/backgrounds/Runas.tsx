'use client'
import { useEffect, useRef } from 'react'

export default function Runas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0

    const chars = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚾᛁᛈᛉᛊᛏᛒᛖᛗᛚᛟᛞ'
    const runes = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      c: chars[Math.floor(Math.random() * chars.length)],
      sz: 13 + Math.random() * 16,
      ph: Math.random() * Math.PI * 2,
      sp: 0.08 + Math.random() * 0.12,
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
      ctx.fillStyle = '#07050d'
      ctx.fillRect(0, 0, W, H)

      runes.forEach(r => {
        ctx.globalAlpha = 0.055 + 0.045 * Math.sin(t * r.sp + r.ph)
        ctx.fillStyle = '#c0a0f0'
        ctx.font = `${r.sz}px serif`
        ctx.fillText(r.c, r.x * W, r.y * H)
      })
      ctx.globalAlpha = 1

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(3,2,6,0.9)')
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
