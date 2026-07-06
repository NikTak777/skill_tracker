export default function ProgressBar({ percent = 0 }) {
  const normalizedPercent = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className="progress" aria-label={`Прогресс ${normalizedPercent}%`}>
      <span style={{ width: `${normalizedPercent}%` }} />
    </div>
  );
}
