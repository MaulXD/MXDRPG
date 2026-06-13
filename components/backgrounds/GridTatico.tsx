'use client'
import { useEffect, useRef } from 'react'

export default function GridTatico() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0
    const C = 32

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
      ctx.fillStyle = '#080b0e'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(60,100,140,0.18)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += C) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += C) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      const pa = 0.06 + 0.025 * Math.sin(t * 0.5)
      const pr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.55)
      pr.addColorStop(0, `rgba(50,120,180,${pa})`)
      pr.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = pr
      ctx.fillRect(0, 0, W, H)

      for (let x = C; x < W; x += C * 4) {
        for (let y = C; y < H; y += C * 4) {
          const a = 0.12 + 0.06 * Math.sin(t * 0.4 + x * 0.01 + y * 0.01)
          ctx.globalAlpha = a
          ctx.fillStyle = '#4080b0'
          ctx.fillRect(x - 1, y - 1, 2, 2)
        }
      }
      ctx.globalAlpha = 1

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(3,5,8,0.88)')
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
