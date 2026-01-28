# Neon Tetris

Современный мини-проект Tetris на React + TypeScript + Vite.

## Запуск

```bash
npm i
npm run dev
```

## Особенности

- Canvas-рендеринг с glow-эффектами.
- 7-bag randomizer для честной генерации фигур.
- Hold + Next (3 штуки), ghost piece.
- Очки, уровни, ускорение падения.
- Звуки через Web Audio API (инициализация после первого взаимодействия).
- Wall kicks: упрощённый вариант — при повороте проверяются смещения (0,0), ±1,0, 0,-1, ±2,0.

## Управление

- ← → перемещение
- ↓ soft drop
- Space hard drop
- ↑ rotate clockwise
- Z rotate counterclockwise
- C hold
- P pause/resume
- M mute/unmute
