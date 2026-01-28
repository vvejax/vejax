export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = {
  type: PieceType;
  color: string;
} | null;

export type Board = Cell[][];

export type Piece = {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
};

export type GameStatus = 'idle' | 'playing' | 'paused' | 'clearing' | 'over';

export type GameState = {
  board: Board;
  current: Piece | null;
  nextQueue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  status: GameStatus;
  muted: boolean;
  clearingLines: number[];
  bag: PieceType[];
};
