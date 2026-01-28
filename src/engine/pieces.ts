import type { Piece, PieceType } from '../types';

const BASE_SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

const COLORS: Record<PieceType, string> = {
  I: '#4cc9f0',
  O: '#f9c74f',
  T: '#b5179e',
  S: '#80ed99',
  Z: '#f72585',
  J: '#3a86ff',
  L: '#f9844a',
};

const rotateMatrix = (matrix: number[][]): number[][] => {
  const size = matrix.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      next[x][size - 1 - y] = matrix[y][x];
    }
  }

  return next;
};

const buildRotations = (shape: number[][]): number[][][] => {
  const rotations = [shape];
  for (let i = 1; i < 4; i += 1) {
    rotations.push(rotateMatrix(rotations[i - 1]));
  }
  return rotations;
};

const ROTATIONS: Record<PieceType, number[][][]> = {
  I: buildRotations(BASE_SHAPES.I),
  O: buildRotations(BASE_SHAPES.O),
  T: buildRotations(BASE_SHAPES.T),
  S: buildRotations(BASE_SHAPES.S),
  Z: buildRotations(BASE_SHAPES.Z),
  J: buildRotations(BASE_SHAPES.J),
  L: buildRotations(BASE_SHAPES.L),
};

export const getShape = (type: PieceType, rotation: number): number[][] => {
  return ROTATIONS[type][rotation % 4];
};

export const getPieceColor = (type: PieceType): string => COLORS[type];

export const createPiece = (type: PieceType): Piece => ({
  type,
  rotation: 0,
  x: 3,
  y: -2,
});

export const createBag = (): PieceType[] => {
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = types.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
};
