import type { Board, Piece } from '../types';
import { getShape } from './pieces';

export const isValidPosition = (
  board: Board,
  piece: Piece,
  offsetX = 0,
  offsetY = 0,
  rotation = piece.rotation,
): boolean => {
  const shape = getShape(piece.type, rotation);

  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;

      if (nextX < 0 || nextX >= board[0].length || nextY >= board.length) {
        return false;
      }

      if (nextY >= 0 && board[nextY][nextX]) {
        return false;
      }
    }
  }

  return true;
};

export const getWallKickOffsets = (): Array<[number, number]> => [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, -1],
  [2, 0],
  [-2, 0],
];

export const getDropDistance = (board: Board, piece: Piece): number => {
  let distance = 0;
  while (isValidPosition(board, piece, 0, distance + 1)) {
    distance += 1;
  }
  return distance;
};
