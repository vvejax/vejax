import { create } from 'zustand';
import type { GameState, Piece, PieceType } from '../types';
import { clearLines, createEmptyBoard, mergePiece } from '../engine/board';
import { getDropDistance, getWallKickOffsets, isValidPosition } from '../engine/collision';
import { createBag, createPiece } from '../engine/pieces';
import { getDropInterval, getLevel, getLineScore } from '../engine/scoring';

const QUEUE_SIZE = 5;

const fillQueue = (queue: PieceType[], bag: PieceType[]) => {
  let nextQueue = [...queue];
  let nextBag = [...bag];
  while (nextQueue.length < QUEUE_SIZE) {
    if (nextBag.length === 0) {
      nextBag = createBag();
    }
    const item = nextBag.pop();
    if (item) nextQueue.push(item);
  }
  return { nextQueue, nextBag };
};

const spawnPiece = (state: GameState) => {
  const { nextQueue, nextBag } = fillQueue(state.nextQueue, state.bag);
  const nextType = nextQueue[0];
  const remainingQueue = nextQueue.slice(1);
  const piece = createPiece(nextType);
  return { piece, queue: remainingQueue, bag: nextBag };
};

const createInitialState = (): GameState => ({
  board: createEmptyBoard(),
  current: null,
  nextQueue: [],
  hold: null,
  canHold: true,
  score: 0,
  level: 0,
  lines: 0,
  status: 'idle',
  muted: false,
  clearingLines: [],
  bag: createBag(),
});

type GameActions = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggleMute: () => void;
  move: (dx: number) => void;
  rotate: (direction: number) => void;
  softDrop: () => void;
  hardDrop: () => void;
  hold: () => void;
  tick: () => void;
  finalizeClear: () => void;
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),
  start: () => {
    const reset = createInitialState();
    const { piece, queue, bag } = spawnPiece(reset);
    const valid = isValidPosition(reset.board, piece);
    set({
      ...reset,
      current: valid ? piece : null,
      nextQueue: queue,
      bag,
      status: valid ? 'playing' : 'over',
    });
  },
  pause: () => set((state) => (state.status === 'playing' ? { status: 'paused' } : {})),
  resume: () => set((state) => (state.status === 'paused' ? { status: 'playing' } : {})),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  move: (dx) =>
    set((state) => {
      if (state.status !== 'playing' || !state.current) return {};
      if (isValidPosition(state.board, state.current, dx, 0)) {
        return { current: { ...state.current, x: state.current.x + dx } };
      }
      return {};
    }),
  rotate: (direction) =>
    set((state) => {
      if (state.status !== 'playing' || !state.current) return {};
      const nextRotation = (state.current.rotation + direction + 4) % 4;
      for (const [offsetX, offsetY] of getWallKickOffsets()) {
        if (isValidPosition(state.board, state.current, offsetX, offsetY, nextRotation)) {
          return {
            current: {
              ...state.current,
              rotation: nextRotation,
              x: state.current.x + offsetX,
              y: state.current.y + offsetY,
            },
          };
        }
      }
      return {};
    }),
  softDrop: () =>
    set((state) => {
      if (state.status !== 'playing' || !state.current) return {};
      if (isValidPosition(state.board, state.current, 0, 1)) {
        return {
          current: { ...state.current, y: state.current.y + 1 },
          score: state.score + 1,
        };
      }
      return {};
    }),
  hardDrop: () =>
    set((state) => {
      if (state.status !== 'playing' || !state.current) return {};
      const distance = getDropDistance(state.board, state.current);
      const dropped: Piece = { ...state.current, y: state.current.y + distance };
      const merged = mergePiece(state.board, dropped);
      const { board, cleared } = clearLines(merged);
      const scored = state.score + distance * 2;
      if (cleared.length > 0) {
        return {
          board: merged,
          current: dropped,
          clearingLines: cleared,
          status: 'clearing',
          score: scored,
        };
      }
      const { piece, queue, bag } = spawnPiece({ ...state, board });
      const valid = isValidPosition(board, piece);
      return {
        board,
        current: valid ? piece : null,
        nextQueue: queue,
        bag,
        status: valid ? 'playing' : 'over',
        score: scored,
        canHold: true,
      };
    }),
  hold: () =>
    set((state) => {
      if (state.status !== 'playing' || !state.current || !state.canHold) return {};
      const currentType = state.current.type;
      const holdType = state.hold;
      if (!holdType) {
        const { piece, queue, bag } = spawnPiece(state);
        return {
          hold: currentType,
          current: piece,
          nextQueue: queue,
          bag,
          canHold: false,
        };
      }
      const swapped = createPiece(holdType);
      const valid = isValidPosition(state.board, swapped);
      return {
        hold: currentType,
        current: valid ? swapped : null,
        status: valid ? state.status : 'over',
        canHold: false,
      };
    }),
  tick: () =>
    set((state) => {
      if (state.status !== 'playing' || !state.current) return {};
      if (isValidPosition(state.board, state.current, 0, 1)) {
        return { current: { ...state.current, y: state.current.y + 1 } };
      }
      const merged = mergePiece(state.board, state.current);
      const { board, cleared } = clearLines(merged);
      if (cleared.length > 0) {
        return {
          board: merged,
          clearingLines: cleared,
          status: 'clearing',
        };
      }
      const { piece, queue, bag } = spawnPiece({ ...state, board });
      const valid = isValidPosition(board, piece);
      return {
        board,
        current: valid ? piece : null,
        nextQueue: queue,
        bag,
        status: valid ? 'playing' : 'over',
        canHold: true,
      };
    }),
  finalizeClear: () =>
    set((state) => {
      if (state.clearingLines.length === 0) return {};
      const { board, cleared } = clearLines(state.board);
      const nextLines = state.lines + cleared.length;
      const nextLevel = getLevel(nextLines);
      const addedScore = getLineScore(cleared.length, state.level);
      const { piece, queue, bag } = spawnPiece({ ...state, board });
      const valid = isValidPosition(board, piece);
      return {
        board,
        current: valid ? piece : null,
        nextQueue: queue,
        bag,
        lines: nextLines,
        level: nextLevel,
        score: state.score + addedScore,
        status: valid ? 'playing' : 'over',
        clearingLines: [],
        canHold: true,
      };
    }),
}));

export const selectDropInterval = (state: GameState) => getDropInterval(state.level);
