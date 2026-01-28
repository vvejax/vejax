import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SfxEngine } from './audio/sfx';
import { mergePiece } from './engine/board';
import { getDropDistance } from './engine/collision';
import { getPieceColor, getShape } from './engine/pieces';
import { selectDropInterval, useGameStore } from './store/gameStore';
import type { Board, PieceType } from './types';

const ROWS = 20;
const COLS = 10;
const CELL = 28;

const useDropLoop = () => {
  const tick = useGameStore((state) => state.tick);
  const status = useGameStore((state) => state.status);
  const interval = useGameStore(selectDropInterval);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    const loop = (time: number) => {
      if (!lastRef.current) lastRef.current = time;
      const delta = time - lastRef.current;
      lastRef.current = time;
      if (status === 'playing') {
        accRef.current += delta;
        if (accRef.current > interval) {
          tick();
          accRef.current = 0;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [interval, status, tick]);
};

const drawBoard = (
  canvas: HTMLCanvasElement,
  board: Board,
  current: ReturnType<typeof useGameStore>['current'],
  ghostDistance: number,
  clearingLines: number[],
  flash: boolean,
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boardWithPiece = current ? mergePiece(board, current) : board;

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = boardWithPiece[y][x];
      const isClearing = clearingLines.includes(y);
      if (cell) {
        const color = isClearing && flash ? '#f8fafc' : cell.color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  if (current) {
    const ghost = { ...current, y: current.y + ghostDistance };
    const shape = getShape(ghost.type, ghost.rotation);
    const ghostColor = getPieceColor(ghost.type);
    ctx.fillStyle = ghostColor;
    ctx.globalAlpha = 0.2;
    for (let y = 0; y < shape.length; y += 1) {
      for (let x = 0; x < shape[y].length; x += 1) {
        if (!shape[y][x]) continue;
        const drawX = ghost.x + x;
        const drawY = ghost.y + y;
        if (drawY >= 0) {
          ctx.fillRect(drawX * CELL, drawY * CELL, CELL - 1, CELL - 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
};

const MiniPiece = ({ type }: { type: PieceType }) => {
  const shape = getShape(type, 0);
  const color = getPieceColor(type);
  return (
    <div className="grid grid-cols-4 gap-1">
      {shape.flatMap((row, y) =>
        row.map((cell, x) => (
          <span
            key={`${type}-${x}-${y}`}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: cell ? color : 'transparent',
              boxShadow: cell ? `0 0 6px ${color}` : 'none',
            }}
          />
        )),
      )}
    </div>
  );
};

const ControlHint = ({ label, keys }: { label: string; keys: string }) => (
  <div className="flex items-center justify-between text-xs text-slate-300">
    <span>{label}</span>
    <span className="font-semibold text-slate-200">{keys}</span>
  </div>
);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sfxRef = useRef(new SfxEngine());
  const [audioReady, setAudioReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const board = useGameStore((state) => state.board);
  const current = useGameStore((state) => state.current);
  const nextQueue = useGameStore((state) => state.nextQueue);
  const hold = useGameStore((state) => state.hold);
  const score = useGameStore((state) => state.score);
  const level = useGameStore((state) => state.level);
  const lines = useGameStore((state) => state.lines);
  const status = useGameStore((state) => state.status);
  const muted = useGameStore((state) => state.muted);
  const clearingLines = useGameStore((state) => state.clearingLines);

  const start = useGameStore((state) => state.start);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const move = useGameStore((state) => state.move);
  const rotate = useGameStore((state) => state.rotate);
  const softDrop = useGameStore((state) => state.softDrop);
  const hardDrop = useGameStore((state) => state.hardDrop);
  const holdAction = useGameStore((state) => state.hold);
  const finalizeClear = useGameStore((state) => state.finalizeClear);

  useDropLoop();

  const ghostDistance = useMemo(() => {
    if (!current) return 0;
    return getDropDistance(board, current);
  }, [board, current]);

  const bootAudio = useCallback(() => {
    if (audioReady) return;
    sfxRef.current.init();
    sfxRef.current.setMuted(muted);
    setAudioReady(true);
  }, [audioReady, muted]);

  useEffect(() => {
    sfxRef.current.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBoard(canvas, board, current, ghostDistance, clearingLines, flash);
  }, [board, current, ghostDistance, clearingLines, flash]);

  useEffect(() => {
    if (clearingLines.length === 0) return;
    sfxRef.current.lineClear();
    const interval = window.setInterval(() => setFlash((prev) => !prev), 120);
    const timeout = window.setTimeout(() => {
      clearInterval(interval);
      setFlash(false);
      finalizeClear();
    }, 420);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [clearingLines, finalizeClear]);

  useEffect(() => {
    if (status === 'over') {
      sfxRef.current.gameOver();
    }
  }, [status]);

  const previousLevel = useRef(level);
  useEffect(() => {
    if (level > previousLevel.current) {
      sfxRef.current.levelUp();
      previousLevel.current = level;
    }
  }, [level]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      bootAudio();
      if (status === 'idle') {
        start();
        return;
      }
      if (status === 'over') {
        if (event.key === 'Enter') {
          start();
        }
        return;
      }
      if (event.key === 'p' || event.key === 'P') {
        if (status === 'paused') resume();
        else if (status === 'playing') pause();
        return;
      }
      if (event.key === 'm' || event.key === 'M') {
        toggleMute();
        return;
      }
      if (status !== 'playing') return;
      switch (event.key) {
        case 'ArrowLeft':
          move(-1);
          sfxRef.current.move();
          break;
        case 'ArrowRight':
          move(1);
          sfxRef.current.move();
          break;
        case 'ArrowDown':
          softDrop();
          sfxRef.current.softDrop();
          break;
        case 'ArrowUp':
          rotate(1);
          sfxRef.current.rotate();
          break;
        case 'z':
        case 'Z':
          rotate(-1);
          sfxRef.current.rotate();
          break;
        case ' ': {
          hardDrop();
          sfxRef.current.hardDrop();
          break;
        }
        case 'c':
        case 'C':
          holdAction();
          sfxRef.current.rotate();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    bootAudio,
    hardDrop,
    holdAction,
    move,
    pause,
    resume,
    rotate,
    softDrop,
    start,
    status,
    toggleMute,
  ]);

  const nextPieces = nextQueue.slice(0, 3);
  const statusLabel =
    status === 'idle'
      ? 'Нажмите любую клавишу для старта'
      : status === 'paused'
        ? 'Пауза'
        : status === 'over'
          ? 'Game Over — Enter для рестарта'
          : 'Играем!';

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neon-pink">Neon</p>
              <h1 className="text-3xl font-semibold">Tetris Pulse</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                bootAudio();
                start();
              }}
              className="rounded-full bg-neon-pink px-5 py-2 text-sm font-semibold text-slate-950 shadow-neon"
            >
              Новая игра
            </button>
          </header>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-2xl">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{statusLabel}</span>
              <span>{muted ? 'Muted' : 'Audio On'}</span>
            </div>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row">
              <div className="neon-panel relative rounded-2xl p-4">
                <canvas
                  ref={canvasRef}
                  width={COLS * CELL}
                  height={ROWS * CELL}
                  className="rounded-xl"
                />
                {status === 'paused' && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/70 text-xl font-semibold">
                    Пауза
                  </div>
                )}
                {status === 'over' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 text-center">
                    <p className="text-2xl font-semibold">Game Over</p>
                    <p className="text-sm text-slate-300">Enter — рестарт</p>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-4 lg:w-64">
                <div className="neon-panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
                  <p className="text-2xl font-semibold">{score}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Level</p>
                      <p className="text-lg font-semibold">{level}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lines</p>
                      <p className="text-lg font-semibold">{lines}</p>
                    </div>
                  </div>
                </div>

                <div className="neon-panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hold</p>
                  <div className="mt-3 min-h-[72px] rounded-xl border border-dashed border-slate-700/70 p-2">
                    {hold ? <MiniPiece type={hold} /> : <p className="text-xs text-slate-500">Пусто</p>}
                  </div>
                </div>

                <div className="neon-panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next</p>
                  <div className="mt-3 flex flex-col gap-3">
                    {nextPieces.map((piece) => (
                      <MiniPiece key={`next-${piece}`} type={piece} />
                    ))}
                  </div>
                </div>

                <div className="neon-panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Controls</p>
                  <div className="mt-3 space-y-2">
                    <ControlHint label="Move" keys="← →" />
                    <ControlHint label="Soft Drop" keys="↓" />
                    <ControlHint label="Hard Drop" keys="Space" />
                    <ControlHint label="Rotate" keys="↑ / Z" />
                    <ControlHint label="Hold" keys="C" />
                    <ControlHint label="Pause" keys="P" />
                    <ControlHint label="Mute" keys="M" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
