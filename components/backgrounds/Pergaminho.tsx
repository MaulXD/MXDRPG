'use client'
import { useEffect, useRef } from 'react'

export default function Pergaminho() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let t = 0
    const C = 42

    type Cell = { x: number; y: number; s: number }
    let cells: Cell[] = []

    function buildCells(W: number, H: number) {
      cells = []
      const cols = Math.ceil(W / C) + 1, rows = Math.ceil(H / C) + 1
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const h = (r * 883 + c * 421) % 100
          cells.push({ x: c * C, y: r * C, s: h })
        }
    }

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      buildCells(canvas!.width, canvas!.height)
    }
    resize()

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100) }
    window.addEventListener('resize', onResize)

    const lights = [
      { x: 0.5, y: 0.5, r: 250, i: 0 },
      { x: 0.15, y: 0.25, r: 130, i: 1.4 },
      { x: 0.85, y: 0.75, r: 120, i: 2.8 },
    ]

    function frame() {
      t += 0.008
      const W = canvas!.width, H = canvas!.height
      ctx.fillStyle = '#0c0905'
      ctx.fillRect(0, 0, W, H)

      cells.forEach(cl => {
        const b = 11 + cl.s * 0.075
        ctx.fillStyle = `rgb(${b + 3},${Math.floor(b * 0.88)},${Math.floor(b * 0.5)})`
        ctx.fillRect(cl.x, cl.y, C, C)
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'
        ctx.lineWidth = 0.35
        ctx.strokeRect(cl.x, cl.y, C, C)
      })

      lights.forEach(g => {
        const p = 0.042 + 0.012 * Math.sin(t * 0.38 + g.i)
        const gr = ctx.createRadialGradient(g.x * W, g.y * H, 0, g.x * W, g.y * H, g.r)
        gr.addColorStop(0, `rgba(170,105,35,${p})`)
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gr
        ctx.fillRect(0, 0, W, H)
      })

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(5,3,1,0.92)')
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
