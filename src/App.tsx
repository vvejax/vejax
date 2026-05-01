import { useState } from 'react';

type Operator = '+' | '-' | '×' | '÷' | null;

const formatValue = (value: string) => {
  if (value === '') return '0';
  return value;
};

export default function App() {
  const [display, setDisplay] = useState('0');
  const [first, setFirst] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingSecond, setWaitingSecond] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingSecond) {
      setDisplay(digit);
      setWaitingSecond(false);
      return;
    }
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const inputDot = () => {
    if (waitingSecond) {
      setDisplay('0.');
      setWaitingSecond(false);
      return;
    }
    if (!display.includes('.')) setDisplay((prev) => prev + '.');
  };

  const clear = () => {
    setDisplay('0');
    setFirst(null);
    setOperator(null);
    setWaitingSecond(false);
  };

  const chooseOperator = (nextOperator: Exclude<Operator, null>) => {
    const inputValue = Number(display);

    if (first === null) {
      setFirst(inputValue);
    } else if (operator && !waitingSecond) {
      const result = calculate(first, inputValue, operator);
      setDisplay(String(result));
      setFirst(result);
    }

    setOperator(nextOperator);
    setWaitingSecond(true);
  };

  const calculate = (a: number, b: number, op: Exclude<Operator, null>) => {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? 0 : a / b;
    return b;
  };

  const onEqual = () => {
    if (first === null || operator === null) return;
    const second = Number(display);
    const result = calculate(first, second, operator);
    setDisplay(String(result));
    setFirst(null);
    setOperator(null);
    setWaitingSecond(true);
  };

  const toggleSign = () => {
    if (display === '0') return;
    setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : `-${prev}`));
  };

  const percent = () => {
    setDisplay(String(Number(display) / 100));
  };

  const Button = ({
    label,
    onClick,
    className = '',
  }: {
    label: string;
    onClick: () => void;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-4 text-xl font-semibold transition active:scale-95 ${className}`}
    >
      {label}
    </button>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <h1 className="mb-4 text-center text-2xl font-bold">Калькулятор</h1>
        <div className="mb-4 rounded-2xl bg-black/40 p-4 text-right text-4xl font-semibold">
          {formatValue(display)}
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Button label="C" onClick={clear} className="bg-slate-700" />
          <Button label="±" onClick={toggleSign} className="bg-slate-700" />
          <Button label="%" onClick={percent} className="bg-slate-700" />
          <Button label="÷" onClick={() => chooseOperator('÷')} className="bg-orange-500" />

          <Button label="7" onClick={() => inputDigit('7')} className="bg-slate-800" />
          <Button label="8" onClick={() => inputDigit('8')} className="bg-slate-800" />
          <Button label="9" onClick={() => inputDigit('9')} className="bg-slate-800" />
          <Button label="×" onClick={() => chooseOperator('×')} className="bg-orange-500" />

          <Button label="4" onClick={() => inputDigit('4')} className="bg-slate-800" />
          <Button label="5" onClick={() => inputDigit('5')} className="bg-slate-800" />
          <Button label="6" onClick={() => inputDigit('6')} className="bg-slate-800" />
          <Button label="-" onClick={() => chooseOperator('-')} className="bg-orange-500" />

          <Button label="1" onClick={() => inputDigit('1')} className="bg-slate-800" />
          <Button label="2" onClick={() => inputDigit('2')} className="bg-slate-800" />
          <Button label="3" onClick={() => inputDigit('3')} className="bg-slate-800" />
          <Button label="+" onClick={() => chooseOperator('+')} className="bg-orange-500" />

          <Button label="0" onClick={() => inputDigit('0')} className="col-span-2 bg-slate-800" />
          <Button label="." onClick={inputDot} className="bg-slate-800" />
          <Button label="=" onClick={onEqual} className="bg-emerald-500" />
        </div>
      </div>
    </main>
  );
}
