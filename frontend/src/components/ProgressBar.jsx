export default function ProgressBar({ percent = 0 }) {
  const normalizedPercent = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className="progress-block">
      <div className="progress-block__label">
        <span>Прогресс</span>
        <strong>{normalizedPercent}%</strong>
      </div>
      <div className="progress" aria-label={`Прогресс ${normalizedPercent}%`}>
        <span style={{ width: `${normalizedPercent}%` }} />
      </div>
    </div>
  );
}
