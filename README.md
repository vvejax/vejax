# Neon Tetris (Python server)

Современный мини-проект Tetris на чистом HTML/CSS/JS, запускается через Python HTTP сервер.

## Запуск (Windows / macOS / Linux)

```bash
python -m http.server 8000
```

После запуска откройте в браузере:

```
http://localhost:8000
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
