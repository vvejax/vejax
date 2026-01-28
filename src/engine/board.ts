import type { Board, Piece } from '../types';
import { getPieceColor, getShape } from './pieces';

export const createEmptyBoard = (rows = 20, cols = 10): Board => {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
};

export const mergePiece = (board: Board, piece: Piece): Board => {
  const shape = getShape(piece.type, piece.rotation);
  const nextBoard = board.map((row) => row.slice());
  const color = getPieceColor(piece.type);

  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardY = piece.y + y;
      const boardX = piece.x + x;
      if (boardY < 0) continue;
      if (boardY >= 0 && boardY < nextBoard.length) {
        nextBoard[boardY][boardX] = { type: piece.type, color };
      }
    }
  }

  return nextBoard;
};

export const clearLines = (board: Board): { board: Board; cleared: number[] } => {
  const cleared: number[] = [];
  const remaining = board.filter((row, index) => {
    const full = row.every((cell) => cell !== null);
    if (full) cleared.push(index);
    return !full;
  });

  const emptyRows = Array.from({ length: cleared.length }, () =>
    Array(board[0].length).fill(null),
  );

  return {
    board: [...emptyRows, ...remaining],
    cleared,
  };
};
