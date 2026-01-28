const { useState } = React;

const initialState = {
  display: '0',
  accumulator: null,
  operator: null,
  waitingForOperand: false,
};

const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

function Calculator() {
  const [state, setState] = useState(initialState);

  const inputDigit = (digit) => {
    setState((prev) => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: String(digit),
          waitingForOperand: false,
        };
      }

      const nextDisplay = prev.display === '0' ? String(digit) : prev.display + digit;
      return { ...prev, display: nextDisplay };
    });
  };

  const inputDecimal = () => {
    setState((prev) => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: '0.',
          waitingForOperand: false,
        };
      }

      if (prev.display.includes('.')) {
        return prev;
      }

      return { ...prev, display: `${prev.display}.` };
    });
  };

  const clearAll = () => {
    setState(initialState);
  };

  const toggleSign = () => {
    setState((prev) => ({
      ...prev,
      display: prev.display.startsWith('-')
        ? prev.display.slice(1)
        : `-${prev.display}`,
    }));
  };

  const inputPercent = () => {
    setState((prev) => ({
      ...prev,
      display: String(Number(prev.display) / 100),
    }));
  };

  const performOperation = (nextOperator) => {
    setState((prev) => {
      const inputValue = Number(prev.display);

      if (prev.operator && prev.waitingForOperand) {
        return { ...prev, operator: nextOperator };
      }

      if (prev.accumulator == null) {
        return {
          ...prev,
          accumulator: inputValue,
          operator: nextOperator,
          waitingForOperand: true,
        };
      }

      if (!prev.operator) {
        return {
          ...prev,
          operator: nextOperator,
          waitingForOperand: true,
        };
      }

      const result = operations[prev.operator](prev.accumulator, inputValue);

      return {
        ...prev,
        display: String(result),
        accumulator: result,
        operator: nextOperator,
        waitingForOperand: true,
      };
    });
  };

  const handleEquals = () => {
    setState((prev) => {
      const inputValue = Number(prev.display);

      if (prev.operator == null || prev.accumulator == null) {
        return prev;
      }

      const result = operations[prev.operator](prev.accumulator, inputValue);

      return {
        ...prev,
        display: String(result),
        accumulator: null,
        operator: null,
        waitingForOperand: true,
      };
    });
  };

  return (
    <div className="page">
      <div className="calculator">
        <header className="calculator__header">
          <div>
            <p className="calculator__eyebrow">Калькулятор</p>
            <h1>Чистый React</h1>
          </div>
          <span className="calculator__badge">Online</span>
        </header>

        <div className="calculator__display" aria-live="polite">
          <span className="calculator__label">Текущее значение</span>
          <div className="calculator__value">{state.display}</div>
        </div>

        <div className="calculator__grid">
          <button type="button" className="btn btn--utility" onClick={clearAll}>
            C
          </button>
          <button type="button" className="btn btn--utility" onClick={toggleSign}>
            ±
          </button>
          <button type="button" className="btn btn--utility" onClick={inputPercent}>
            %
          </button>
          <button
            type="button"
            className="btn btn--operator"
            onClick={() => performOperation('÷')}
          >
            ÷
          </button>

          <button type="button" className="btn" onClick={() => inputDigit(7)}>
            7
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(8)}>
            8
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(9)}>
            9
          </button>
          <button
            type="button"
            className="btn btn--operator"
            onClick={() => performOperation('×')}
          >
            ×
          </button>

          <button type="button" className="btn" onClick={() => inputDigit(4)}>
            4
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(5)}>
            5
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(6)}>
            6
          </button>
          <button
            type="button"
            className="btn btn--operator"
            onClick={() => performOperation('-')}
          >
            -
          </button>

          <button type="button" className="btn" onClick={() => inputDigit(1)}>
            1
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(2)}>
            2
          </button>
          <button type="button" className="btn" onClick={() => inputDigit(3)}>
            3
          </button>
          <button
            type="button"
            className="btn btn--operator"
            onClick={() => performOperation('+')}
          >
            +
          </button>

          <button type="button" className="btn btn--wide" onClick={() => inputDigit(0)}>
            0
          </button>
          <button type="button" className="btn" onClick={inputDecimal}>
            .
          </button>
          <button type="button" className="btn btn--operator" onClick={handleEquals}>
            =
          </button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Calculator />);
