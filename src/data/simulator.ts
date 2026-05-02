export type Metrics = {
  conversionRate: number;
  activationRate: number;
  purchaseConversion: number;
  arpu: number;
  retentionD7: number;
  revenue: number;
  nps: number;
  complaints: number;
};

export type MetricDelta = Partial<Metrics>;

export type Option = {
  key: 'A' | 'B' | 'C' | 'D';
  title: string;
  logic: string;
  delta: MetricDelta;
  risk: string;
  commentary: string;
};

export type Round = {
  id: number;
  situation: string;
  options: Option[];
};

export const baseline: Metrics = {
  conversionRate: 24,
  activationRate: 41,
  purchaseConversion: 6.8,
  arpu: 4.2,
  retentionD7: 18,
  revenue: 42000,
  nps: 31,
  complaints: 120,
};

export const rounds: Round[] = Array.from({ length: 20 }, (_, i) => ({
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
      delta: {
        conversionRate: -2.2,
        activationRate: 3,
        purchaseConversion: 0.5,
        arpu: 0.2,
        retentionD7: 1.2,
        complaints: 8,
        revenue: 900,
      },
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

export const metricRows: Array<{ key: keyof Metrics; label: string; suffix?: string; money?: boolean }> = [
  { key: 'conversionRate', label: 'Conversion Rate', suffix: '%' },
  { key: 'activationRate', label: 'Activation Rate', suffix: '%' },
  { key: 'purchaseConversion', label: 'Purchase Conversion', suffix: '%' },
  { key: 'retentionD7', label: 'Retention D7', suffix: '%' },
  { key: 'arpu', label: 'ARPU', money: true },
  { key: 'revenue', label: 'Revenue', money: true },
  { key: 'nps', label: 'NPS/CSAT' },
  { key: 'complaints', label: 'Complaints', suffix: '/мес' },
];

export const applyDelta = (metrics: Metrics, delta: MetricDelta): Metrics => ({
  conversionRate: Math.max(0, metrics.conversionRate + (delta.conversionRate ?? 0)),
  activationRate: Math.max(0, metrics.activationRate + (delta.activationRate ?? 0)),
  purchaseConversion: Math.max(0, metrics.purchaseConversion + (delta.purchaseConversion ?? 0)),
  arpu: Math.max(0, metrics.arpu + (delta.arpu ?? 0)),
  retentionD7: Math.max(0, metrics.retentionD7 + (delta.retentionD7 ?? 0)),
  revenue: Math.max(0, metrics.revenue + (delta.revenue ?? 0)),
  nps: Math.max(-100, Math.min(100, metrics.nps + (delta.nps ?? 0))),
  complaints: Math.max(0, Math.round(metrics.complaints + (delta.complaints ?? 0))),
});
