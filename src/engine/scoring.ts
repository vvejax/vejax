export const getLineScore = (lines: number, level: number): number => {
  const base = [0, 100, 300, 500, 800][lines] ?? 0;
  return base * (level + 1);
};

export const getLevel = (lines: number): number => Math.floor(lines / 10);

export const getDropInterval = (level: number): number => {
  return Math.max(100, 800 - level * 60);
};
