export default function Stepper({ value, onDecrement, onIncrement, decrementLabel, incrementLabel, valueId }) {
  return (
    <div className="stepper">
      <button type="button" aria-label={decrementLabel} onClick={onDecrement}>
        −
      </button>
      <span className="stepper-value" id={valueId}>
        {value}
      </span>
      <button type="button" aria-label={incrementLabel} onClick={onIncrement}>
        +
      </button>
    </div>
  );
}
