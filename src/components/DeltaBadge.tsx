export const DeltaBadge = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-slate-400 text-xs">—</span>;
  const up = value > 0;
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        up ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
    </span>
  );
};
