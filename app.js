const ROWS = 20;
const COLS = 10;
const CELL = 28;
const QUEUE_SIZE = 5;

const SHAPES = {
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

const COLORS = {
  I: '#4cc9f0',
  O: '#f9c74f',
  T: '#b5179e',
  S: '#80ed99',
  Z: '#f72585',
  J: '#3a86ff',
  L: '#f9844a',
};

const WALL_KICKS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, -1],
  [2, 0],
  [-2, 0],
];

const statusLabel = document.getElementById('status-label');
const audioLabel = document.getElementById('audio-label');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const holdEl = document.getElementById('hold');
const nextEl = document.getElementById('next');
const overlayEl = document.getElementById('overlay');
const newGameBtn = document.getElementById('new-game');
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

const rotateMatrix = (matrix) => {
  const size = matrix.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      next[x][size - 1 - y] = matrix[y][x];
    }
  }
  return next;
};

const buildRotations = (shape) => {
  const rotations = [shape];
  for (let i = 1; i < 4; i += 1) {
    rotations.push(rotateMatrix(rotations[i - 1]));
  }
  return rotations;
};

const ROTATIONS = Object.fromEntries(
  Object.entries(SHAPES).map(([key, shape]) => [key, buildRotations(shape)]),
);

const getShape = (type, rotation) => ROTATIONS[type][rotation % 4];

const createPiece = (type) => ({
  type,
  rotation: 0,
  x: 3,
  y: -2,
});

const createBag = () => {
  const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = types.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
};

const isValidPosition = (board, piece, offsetX = 0, offsetY = 0, rotation = piece.rotation) => {
  const shape = getShape(piece.type, rotation);
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const nextX = piece.x + x + offsetX;
      const nextY = piece.y + y + offsetY;
      if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return false;
      if (nextY >= 0 && board[nextY][nextX]) return false;
    }
  }
  return true;
};

const mergePiece = (board, piece) => {
  const shape = getShape(piece.type, piece.rotation);
  const next = board.map((row) => row.slice());
  const color = COLORS[piece.type];
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardY = piece.y + y;
      const boardX = piece.x + x;
      if (boardY < 0) continue;
      next[boardY][boardX] = { type: piece.type, color };
    }
  }
  return next;
};

const clearLines = (board) => {
  const cleared = [];
  const remaining = board.filter((row, index) => {
    const full = row.every((cell) => cell !== null);
    if (full) cleared.push(index);
    return !full;
  });
  const emptyRows = Array.from({ length: cleared.length }, () =>
    Array.from({ length: COLS }, () => null),
  );
  return { board: [...emptyRows, ...remaining], cleared };
};

const getDropDistance = (board, piece) => {
  let distance = 0;
  while (isValidPosition(board, piece, 0, distance + 1)) {
    distance += 1;
  }
  return distance;
};

const getLineScore = (lines, level) => {
  const base = [0, 100, 300, 500, 800][lines] ?? 0;
  return base * (level + 1);
};

const getLevel = (lines) => Math.floor(lines / 10);
const getDropInterval = (level) => Math.max(100, 800 - level * 60);

class SfxEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
  }

  init() {
    if (this.context) return;
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.08;
    this.masterGain.connect(this.context.destination);
  }

  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.08;
    }
  }

  playTone(frequency, duration = 0.08, type = 'sine') {
    if (!this.context || !this.masterGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.9;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  move() {
    this.playTone(420, 0.05, 'triangle');
  }

  rotate() {
    this.playTone(620, 0.06, 'square');
  }

  softDrop() {
    this.playTone(220, 0.04, 'sine');
  }

  hardDrop() {
    this.playTone(140, 0.1, 'sawtooth');
  }

  lineClear() {
    this.playTone(780, 0.12, 'triangle');
    this.playTone(980, 0.12, 'triangle');
  }

  levelUp() {
    this.playTone(520, 0.1, 'square');
    this.playTone(820, 0.12, 'square');
  }

  gameOver() {
    this.playTone(120, 0.3, 'sawtooth');
  }
}

const sfx = new SfxEngine();
let audioReady = false;

const state = {
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
};

const fillQueue = (queue, bag) => {
  let nextQueue = [...queue];
  let nextBag = [...bag];
  while (nextQueue.length < QUEUE_SIZE) {
    if (nextBag.length === 0) nextBag = createBag();
    const item = nextBag.pop();
    if (item) nextQueue.push(item);
  }
  return { nextQueue, nextBag };
};

const spawnPiece = () => {
  const { nextQueue, nextBag } = fillQueue(state.nextQueue, state.bag);
  const nextType = nextQueue[0];
  state.nextQueue = nextQueue.slice(1);
  state.bag = nextBag;
  state.current = createPiece(nextType);
};

const resetGame = () => {
  state.board = createEmptyBoard();
  state.current = null;
  state.nextQueue = [];
  state.hold = null;
  state.canHold = true;
  state.score = 0;
  state.level = 0;
  state.lines = 0;
  state.status = 'playing';
  state.clearingLines = [];
  state.bag = createBag();
  spawnPiece();
  if (!isValidPosition(state.board, state.current)) {
    state.current = null;
    state.status = 'over';
  }
  updateUI();
  draw();
};

const updateUI = () => {
  const statusText =
    state.status === 'idle'
      ? 'Нажмите любую клавишу для старта'
      : state.status === 'paused'
        ? 'Пауза'
        : state.status === 'over'
          ? 'Game Over — Enter для рестарта'
          : 'Играем!';
  statusLabel.textContent = statusText;
  audioLabel.textContent = state.muted ? 'Muted' : 'Audio On';
  scoreEl.textContent = state.score;
  levelEl.textContent = state.level;
  linesEl.textContent = state.lines;
  renderMini(state.hold, holdEl);
  renderQueue(state.nextQueue.slice(0, 3), nextEl);

  if (state.status === 'paused') {
    overlayEl.textContent = 'Пауза';
    overlayEl.classList.remove('hidden');
  } else if (state.status === 'over') {
    overlayEl.innerHTML = '<div>Game Over<br/><span style="font-size:14px;color:#cbd5f5">Enter — рестарт</span></div>';
    overlayEl.classList.remove('hidden');
  } else {
    overlayEl.classList.add('hidden');
    overlayEl.textContent = '';
  }
};

const renderMini = (type, target) => {
  target.innerHTML = '';
  if (!type) {
    const empty = document.createElement('p');
    empty.textContent = 'Пусто';
    empty.style.fontSize = '12px';
    empty.style.color = 'rgba(148,163,184,0.8)';
    target.append(empty);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'mini-grid';
  const shape = getShape(type, 0);
  const color = COLORS[type];
  shape.flat().forEach((cell) => {
    const span = document.createElement('span');
    span.className = 'mini-cell';
    if (cell) {
      span.style.background = color;
      span.style.boxShadow = `0 0 6px ${color}`;
    }
    grid.append(span);
  });
  target.append(grid);
};

const renderQueue = (queue, target) => {
  target.innerHTML = '';
  queue.forEach((type) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mini';
    wrapper.style.border = 'none';
    wrapper.style.padding = '0';
    renderMini(type, wrapper);
    target.append(wrapper);
  });
};

const draw = (flash = false) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boardToDraw = state.current ? mergePiece(state.board, state.current) : state.board;

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = boardToDraw[y][x];
      const isClearing = state.clearingLines.includes(y);
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

  if (state.current) {
    const ghostDistance = getDropDistance(state.board, state.current);
    const ghost = { ...state.current, y: state.current.y + ghostDistance };
    const shape = getShape(ghost.type, ghost.rotation);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS[ghost.type];
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

const finalizeClear = () => {
  if (state.clearingLines.length === 0) return;
  const { board, cleared } = clearLines(state.board);
  state.board = board;
  state.clearingLines = [];
  state.lines += cleared.length;
  const nextLevel = getLevel(state.lines);
  if (nextLevel > state.level) {
    sfx.levelUp();
  }
  state.level = nextLevel;
  state.score += getLineScore(cleared.length, state.level);
  spawnPiece();
  state.canHold = true;
  state.status = isValidPosition(state.board, state.current) ? 'playing' : 'over';
  if (state.status === 'over') sfx.gameOver();
};

const lockPiece = () => {
  state.board = mergePiece(state.board, state.current);
  const { cleared } = clearLines(state.board);
  if (cleared.length > 0) {
    state.clearingLines = cleared;
    state.status = 'clearing';
    sfx.lineClear();
    let flash = false;
    const interval = setInterval(() => {
      flash = !flash;
      draw(flash);
    }, 120);
    setTimeout(() => {
      clearInterval(interval);
      finalizeClear();
      updateUI();
      draw();
    }, 420);
    return;
  }
  spawnPiece();
  state.canHold = true;
  if (!isValidPosition(state.board, state.current)) {
    state.status = 'over';
    sfx.gameOver();
  }
};

const move = (dx) => {
  if (state.status !== 'playing') return;
  if (isValidPosition(state.board, state.current, dx, 0)) {
    state.current.x += dx;
    sfx.move();
  }
};

const rotate = (direction) => {
  if (state.status !== 'playing') return;
  const nextRotation = (state.current.rotation + direction + 4) % 4;
  for (const [offsetX, offsetY] of WALL_KICKS) {
    if (isValidPosition(state.board, state.current, offsetX, offsetY, nextRotation)) {
      state.current.rotation = nextRotation;
      state.current.x += offsetX;
      state.current.y += offsetY;
      sfx.rotate();
      return;
    }
  }
};

const softDrop = () => {
  if (state.status !== 'playing') return;
  if (isValidPosition(state.board, state.current, 0, 1)) {
    state.current.y += 1;
    state.score += 1;
    sfx.softDrop();
  }
};

const hardDrop = () => {
  if (state.status !== 'playing') return;
  const distance = getDropDistance(state.board, state.current);
  state.current.y += distance;
  state.score += distance * 2;
  sfx.hardDrop();
  lockPiece();
};

const hold = () => {
  if (state.status !== 'playing' || !state.canHold) return;
  const currentType = state.current.type;
  if (!state.hold) {
    state.hold = currentType;
    spawnPiece();
  } else {
    const swapped = createPiece(state.hold);
    state.hold = currentType;
    state.current = swapped;
    if (!isValidPosition(state.board, state.current)) {
      state.status = 'over';
      sfx.gameOver();
    }
  }
  state.canHold = false;
};

const tick = () => {
  if (state.status !== 'playing') return;
  if (isValidPosition(state.board, state.current, 0, 1)) {
    state.current.y += 1;
  } else {
    lockPiece();
  }
};

const bootAudio = () => {
  if (audioReady) return;
  sfx.init();
  sfx.setMuted(state.muted);
  audioReady = true;
};

const toggleMute = () => {
  state.muted = !state.muted;
  sfx.setMuted(state.muted);
};

let lastTime = 0;
let acc = 0;

const loop = (time) => {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;
  if (state.status === 'playing') {
    acc += delta;
    const interval = getDropInterval(state.level);
    if (acc > interval) {
      tick();
      acc = 0;
    }
  }
  updateUI();
  draw();
  requestAnimationFrame(loop);
};

const startGame = () => {
  bootAudio();
  resetGame();
};

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  bootAudio();

  if (state.status === 'idle') {
    resetGame();
    return;
  }

  if (state.status === 'over') {
    if (event.key === 'Enter') {
      resetGame();
    }
    return;
  }

  if (event.key === 'p' || event.key === 'P') {
    state.status = state.status === 'paused' ? 'playing' : 'paused';
    return;
  }

  if (event.key === 'm' || event.key === 'M') {
    toggleMute();
    return;
  }

  if (state.status !== 'playing') return;

  switch (event.key) {
    case 'ArrowLeft':
      move(-1);
      break;
    case 'ArrowRight':
      move(1);
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
      rotate(1);
      break;
    case 'z':
    case 'Z':
      rotate(-1);
      break;
    case ' ':
      hardDrop();
      break;
    case 'c':
    case 'C':
      hold();
      sfx.rotate();
      break;
    default:
      break;
  }
});

newGameBtn.addEventListener('click', startGame);

updateUI();
draw();
requestAnimationFrame(loop);
