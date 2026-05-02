import { useMemo, useState } from 'react';
import { DeltaBadge } from './components/DeltaBadge';
import { applyDelta, baseline, metricRows, rounds, type Metrics, type Option } from './data/simulator';

export default function App() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>(baseline);
  const [prevMetrics, setPrevMetrics] = useState<Metrics>(baseline);
  const [lastChoice, setLastChoice] = useState<Option | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const round = rounds[roundIndex];
  const isFinished = roundIndex >= rounds.length;

  const choose = (option: Option) => {
    setPrevMetrics(metrics);
    const updated = applyDelta(metrics, option.delta);
    setMetrics(updated);
    setLastChoice(option);
    setHistory((prev) => [...prev, `Раунд ${round.id}: ${option.key} — ${option.title}`]);
    setRoundIndex((prev) => prev + 1);
  };

  const reset = () => {
    setRoundIndex(0);
    setMetrics(baseline);
    setPrevMetrics(baseline);
    setLastChoice(null);
    setHistory([]);
  };

  const mentor = useMemo(() => {
    if (!lastChoice) return 'Выбери вариант и смотри, как метрики живут своей жизнью.';
    return `Риск: ${lastChoice.risk}. ${lastChoice.commentary}`;
  }, [lastChoice]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-fuchsia-950 via-indigo-950 to-sky-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl bg-white/10 backdrop-blur-md border border-cyan-300/30 p-5 shadow-2xl shadow-fuchsia-900/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-cyan-300 to-emerald-300 text-transparent bg-clip-text">
            Симулятор продуктового PM (20 раундов)
          </h1>
          <p className="text-slate-200 mt-2">Яркий тренажёр trade-off&apos;ов: рост, retention, monetization и UX.</p>

          {!isFinished ? (
            <>
              <div className="mt-6 rounded-xl bg-indigo-900/40 p-4 border border-violet-300/30">
                <h2 className="font-semibold text-lg text-cyan-200">Раунд {round.id}/20</h2>
                <p className="text-slate-200 mt-2">{round.situation}</p>
              </div>

              <div className="mt-4 grid gap-3">
                {round.options.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => choose(option)}
                    className="text-left rounded-xl border border-cyan-400/20 bg-slate-900/60 hover:bg-slate-800/90 p-4 transition hover:scale-[1.01]"
                  >
                    <p className="font-semibold text-cyan-200">
                      {option.key}) {option.title}
                    </p>
                    <p className="text-sm text-slate-200 mt-1">{option.logic}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl bg-emerald-500/15 border border-emerald-300/50 p-4">
              <h2 className="text-xl font-semibold text-emerald-200">Игра завершена 🎉</h2>
              <p className="text-slate-100 mt-2">Ты прошёл 20 раундов. Сравни итоговые метрики и историю решений.</p>
              <button onClick={reset} className="mt-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 font-medium hover:opacity-90">Начать заново</button>
            </div>
          )}
        </section>

        <aside className="rounded-2xl bg-white/10 backdrop-blur-md border border-cyan-300/30 p-5 space-y-4 shadow-xl shadow-indigo-900/40">
          <h3 className="text-lg font-semibold text-cyan-200">Текущие метрики</h3>
          <ul className="space-y-2 text-sm">
            {metricRows.map((row) => {
              const current = metrics[row.key];
              const previous = prevMetrics[row.key];
              const delta = Number((current - previous).toFixed(1));
              const value = row.money
                ? `$${Math.round(current).toLocaleString()}`
                : `${current.toFixed(1)}${row.suffix ?? ''}`;
              return (
                <li key={row.key} className="flex items-center justify-between rounded-lg bg-slate-900/45 px-3 py-2 border border-slate-500/20">
                  <span>{row.label}</span>
                  <span className="flex items-center gap-2">
                    <b>{value}</b>
                    <DeltaBadge value={delta} />
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="rounded-lg bg-indigo-900/35 p-3 border border-violet-300/30">
            <h4 className="font-medium text-pink-200">Комментарий ментора</h4>
            <p className="text-sm text-slate-100 mt-1">{mentor}</p>
          </div>

          <div>
            <h4 className="font-medium text-cyan-200">История решений</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-100 max-h-52 overflow-auto pr-2">
              {history.length === 0 ? <li>Пока пусто.</li> : history.map((h) => <li key={h}>• {h}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
