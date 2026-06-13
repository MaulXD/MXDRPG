'use client'
import { useEffect, useRef } from 'react'

export default function VoidArcano() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0

    const palette = ['90,70,190', '50,90,170', '130,100,210']
    const dots = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.3 + Math.random() * 0.9,
      ph: Math.random() * Math.PI * 2,
      sp: 0.05 + Math.random() * 0.09,
      c: palette[Math.floor(Math.random() * palette.length)],
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
      ctx.fillStyle = '#040408'
      ctx.fillRect(0, 0, W, H)

      dots.forEach(d => {
        ctx.globalAlpha = 0.1 + 0.1 * Math.sin(t * d.sp + d.ph)
        ctx.fillStyle = `rgb(${d.c})`
        ctx.beginPath()
        ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      const rg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.5)
      rg.addColorStop(0, 'rgba(25,12,65,0.07)')
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, W, H)

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(2,2,5,0.9)')
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
