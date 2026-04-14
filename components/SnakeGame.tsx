'use client'

import { useEffect, useRef, useState } from 'react'

const COLS = 20
const ROWS = 20
const CELL = 16
const SIZE = COLS * CELL // 320px
const BASE_INTERVAL = 220 // slower start
const MIN_INTERVAL = 60   // speed cap
const SPEED_FACTOR = 0.95 // 5% faster per food

type Point = { x: number; y: number }
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Status = 'idle' | 'playing' | 'dead'

const OPPOSITE: Record<Dir, Dir> = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
}

function randomFood(snake: Point[]): Point {
  let pos: Point
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y))
  return pos
}

function draw(canvas: HTMLCanvasElement, snake: Point[], food: Point, status: Status, score: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.fillStyle = '#1e293b'
  for (let x = 0; x < COLS; x++)
    for (let y = 0; y < ROWS; y++)
      ctx.fillRect(x * CELL + 7, y * CELL + 7, 2, 2)

  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
  ctx.fill()

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#4ade80' : '#16a34a'
    ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
  })

  if (status === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', SIZE / 2, SIZE / 2 - 14)
    ctx.font = '14px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`Score: ${score}`, SIZE / 2, SIZE / 2 + 12)
  }

  if (status === 'idle') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SNAKE', SIZE / 2, SIZE / 2 - 16)
    ctx.font = '13px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('Tap to start', SIZE / 2, SIZE / 2 + 12)
  }
}

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9,  y: 10 },
  { x: 8,  y: 10 },
  { x: 7,  y: 10 },
]

export function SnakeGame() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const snakeRef   = useRef<Point[]>(INITIAL_SNAKE)
  const foodRef    = useRef<Point>({ x: 5, y: 5 })
  const dirRef     = useRef<Dir>('RIGHT')
  const nextDirRef = useRef<Dir>('RIGHT')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speedRef   = useRef<number>(BASE_INTERVAL)
  const touchRef   = useRef<{ x: number; y: number } | null>(null)

  const [score, setScore]   = useState(0)
  const [status, setStatus] = useState<Status>('idle')

  function stopLoop() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  function startLoop(interval: number) {
    stopLoop()
    intervalRef.current = setInterval(tick, interval)
  }

  function tick() {
    dirRef.current = nextDirRef.current
    const head = snakeRef.current[0]
    const deltas: Record<Dir, Point> = {
      UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
    }
    const next = { x: head.x + deltas[dirRef.current].x, y: head.y + deltas[dirRef.current].y }

    if (
      next.x < 0 || next.x >= COLS ||
      next.y < 0 || next.y >= ROWS ||
      snakeRef.current.some((s) => s.x === next.x && s.y === next.y)
    ) {
      stopLoop()
      setStatus('dead')
      setScore((s) => {
        if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current, 'dead', s)
        return s
      })
      return
    }

    const ate = next.x === foodRef.current.x && next.y === foodRef.current.y
    snakeRef.current = ate
      ? [next, ...snakeRef.current]
      : [next, ...snakeRef.current.slice(0, -1)]

    if (ate) {
      foodRef.current = randomFood(snakeRef.current)
      // Speed up 5%, capped at MIN_INTERVAL, then restart loop at new speed
      speedRef.current = Math.max(MIN_INTERVAL, Math.round(speedRef.current * SPEED_FACTOR))
      startLoop(speedRef.current)
      setScore((s) => {
        const ns = s + 1
        if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current, 'playing', ns)
        return ns
      })
    } else {
      if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current, 'playing', 0)
    }
  }

  function startGame() {
    stopLoop()
    snakeRef.current  = [...INITIAL_SNAKE]
    foodRef.current   = randomFood(INITIAL_SNAKE)
    dirRef.current    = 'RIGHT'
    nextDirRef.current = 'RIGHT'
    speedRef.current  = BASE_INTERVAL
    setScore(0)
    setStatus('playing')
    startLoop(BASE_INTERVAL)
  }

  function changeDir(next: Dir) {
    if (next !== OPPOSITE[dirRef.current]) nextDirRef.current = next
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Partial<Record<string, Dir>> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      }
      const dir = map[e.key]
      if (dir) { e.preventDefault(); changeDir(dir) }
    }
    window.addEventListener('keydown', onKey)
    if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current, 'idle', 0)
    return () => { window.removeEventListener('keydown', onKey); stopLoop() }
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    e.preventDefault()
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
    if (Math.abs(dx) > Math.abs(dy)) changeDir(dx > 0 ? 'RIGHT' : 'LEFT')
    else changeDir(dy > 0 ? 'DOWN' : 'UP')
    e.preventDefault()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wide">Score</span>
        <span className="text-lg font-bold font-mono text-gray-900">{score}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="rounded-lg touch-none cursor-pointer"
        style={{ imageRendering: 'pixelated', maxWidth: '100%' }}
        onClick={() => { if (status !== 'playing') startGame() }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />

      {status === 'dead' && (
        <button onClick={startGame} className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors font-mono">
          Play Again
        </button>
      )}
      {status === 'idle' && (
        <button onClick={startGame} className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors font-mono">
          Start
        </button>
      )}

      <p className="text-xs text-gray-400">Swipe to steer · Tap canvas to start</p>
    </div>
  )
}
