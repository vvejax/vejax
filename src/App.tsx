import { useMemo, useState } from 'react';

type Metrics = {
  conversionRate: number;
  activationRate: number;
  purchaseConversion: number;
  arpu: number;
  retentionD7: number;
  revenue: number;
  nps: number;
  complaints: number;
};

type MetricDelta = Partial<Metrics>;

type Option = {
  key: 'A' | 'B' | 'C' | 'D';
  title: string;
  logic: string;
  delta: MetricDelta;
  risk: string;
  commentary: string;
};

type Round = {
  id: number;
  situation: string;
  options: Option[];
};

const baseline: Metrics = {
  conversionRate: 24,
  activationRate: 41,
  purchaseConversion: 6.8,
  arpu: 4.2,
  retentionD7: 18,
  revenue: 42000,
  nps: 31,
  complaints: 120,
};

const rounds: Round[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  situation:
    i === 0
      ? 'Много пользователей отваливаются до регистрации. Команда спорит: проблема в ценности, дизайне или слишком длинном старте.'
      : `Раунд ${i + 1}: продукт растёт, но появляется новый компромисс между ростом, монетизацией и удержанием.`,
  options: [
    {
      key: 'A',
      title: 'Сократить onboarding и убрать 1 шаг',
      logic: 'Меньше трения — выше активация, но риск недонести ценность.',
      delta: { conversionRate: 1.1, activationRate: 1.8, retentionD7: -0.3, complaints: -4, revenue: 350 },
      risk: 'Низкий',
      commentary: 'Хорошо для скорости, но следи за качеством активации в долгую.',
    },
    {
      key: 'B',
      title: 'Поменять тексты и CTA на более конкретные',
      logic: 'Понятный value proposition чаще поднимает CR и NPS.',
      delta: { conversionRate: 1.6, activationRate: 0.8, nps: 1.4, revenue: 420 },
      risk: 'Средний',
      commentary: 'Классика growth: маленькая правка, аккуратный uplift.',
    },
    {
      key: 'C',
      title: 'Добавить персонализирующий квиз перед регистрацией',
      logic: 'Срезает холодный трафик, но улучшает downstream метрики.',
      delta: { conversionRate: -2.2, activationRate: 3, purchaseConversion: 0.5, arpu: 0.2, retentionD7: 1.2, complaints: 8, revenue: 900 },
      risk: 'Высокий',
      commentary: 'Смелое решение: минус объём, плюс качество. Не для всех стадий роста.',
    },
    {
      key: 'D',
      title: 'Показать агрессивный paywall сразу после signup',
      logic: 'Даёт мгновенную выручку, но может повредить доверию и retention.',
      delta: { purchaseConversion: 1.1, arpu: 0.35, retentionD7: -1.5, nps: -2, complaints: 14, revenue: 1600 },
      risk: 'Высокий',
      commentary: 'Короткие деньги взял, долгосрочную лояльность можешь потерять.',
    },
  ],
}));

const applyDelta = (metrics: Metrics, delta: MetricDelta): Metrics => ({
  conversionRate: Math.max(0, metrics.conversionRate + (delta.conversionRate ?? 0)),
  activationRate: Math.max(0, metrics.activationRate + (delta.activationRate ?? 0)),
  purchaseConversion: Math.max(0, metrics.purchaseConversion + (delta.purchaseConversion ?? 0)),
  arpu: Math.max(0, metrics.arpu + (delta.arpu ?? 0)),
  retentionD7: Math.max(0, metrics.retentionD7 + (delta.retentionD7 ?? 0)),
  revenue: Math.max(0, metrics.revenue + (delta.revenue ?? 0)),
  nps: Math.max(-100, Math.min(100, metrics.nps + (delta.nps ?? 0))),
  complaints: Math.max(0, Math.round(metrics.complaints + (delta.complaints ?? 0))),
});

export default function App() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>(baseline);
  const [lastChoice, setLastChoice] = useState<Option | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const round = rounds[roundIndex];
  const isFinished = roundIndex >= rounds.length;

  const choose = (option: Option) => {
    const updated = applyDelta(metrics, option.delta);
    setMetrics(updated);
    setLastChoice(option);
    setHistory((prev) => [...prev, `Раунд ${round.id}: ${option.key} — ${option.title}`]);
    setRoundIndex((prev) => prev + 1);
  };

  const reset = () => {
    setRoundIndex(0);
    setMetrics(baseline);
    setLastChoice(null);
    setHistory([]);
  };

  const mentor = useMemo(() => {
    if (!lastChoice) return 'Выбери вариант и смотри, как метрики живут своей жизнью.';
    return `Риск: ${lastChoice.risk}. ${lastChoice.commentary}`;
  }, [lastChoice]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5">
          <h1 className="text-2xl font-bold">Симулятор продуктового PM (20 раундов)</h1>
          <p className="text-slate-300 mt-2">Живой тренажёр trade-off'ов: рост, retention, monetization и UX.</p>

          {!isFinished ? (
            <>
              <div className="mt-6 rounded-xl bg-slate-800/70 p-4 border border-slate-700">
                <h2 className="font-semibold text-lg">Раунд {round.id}/20</h2>
                <p className="text-slate-300 mt-2">{round.situation}</p>
              </div>

              <div className="mt-4 grid gap-3">
                {round.options.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => choose(option)}
                    className="text-left rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 p-4 transition"
                  >
                    <p className="font-semibold">{option.key}) {option.title}</p>
                    <p className="text-sm text-slate-300 mt-1">{option.logic}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl bg-emerald-900/20 border border-emerald-700 p-4">
              <h2 className="text-xl font-semibold">Игра завершена 🎉</h2>
              <p className="text-slate-300 mt-2">Ты прошёл 20 раундов. Сравни итоговые метрики и историю решений.</p>
              <button onClick={reset} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">Начать заново</button>
            </div>
          )}
        </section>

        <aside className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5 space-y-4">
          <h3 className="text-lg font-semibold">Текущие метрики</h3>
          <ul className="space-y-1 text-sm">
            <li>Conversion Rate: <b>{metrics.conversionRate.toFixed(1)}%</b></li>
            <li>Activation Rate: <b>{metrics.activationRate.toFixed(1)}%</b></li>
            <li>Purchase Conversion: <b>{metrics.purchaseConversion.toFixed(1)}%</b></li>
            <li>Retention D7: <b>{metrics.retentionD7.toFixed(1)}%</b></li>
            <li>ARPU: <b>${metrics.arpu.toFixed(2)}</b></li>
            <li>Revenue: <b>${Math.round(metrics.revenue).toLocaleString()}</b></li>
            <li>NPS/CSAT: <b>{metrics.nps.toFixed(1)}</b></li>
            <li>Complaints: <b>{metrics.complaints}/мес</b></li>
          </ul>

          <div className="rounded-lg bg-slate-800 p-3 border border-slate-700">
            <h4 className="font-medium">Комментарий ментора</h4>
            <p className="text-sm text-slate-300 mt-1">{mentor}</p>
          </div>

          <div>
            <h4 className="font-medium">История решений</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-300 max-h-52 overflow-auto pr-2">
              {history.length === 0 ? <li>Пока пусто.</li> : history.map((h) => <li key={h}>• {h}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
