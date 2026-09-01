export default function RestaurantLoader({ label = "Preparing something delicious" }: { label?: string }) {
  return (
    <div className="zaika-loader-page" role="status" aria-live="polite" aria-label={label}>
      <div className="zaika-loader-card">
        <div className="zaika-loader-plate"><span>✦</span></div>
        <div className="zaika-loader-steam"><i /><i /><i /></div>
        <p className="zaika-loader-kicker">Zaika Kitchen</p>
        <p className="zaika-loader-title">{label}</p>

        <div className="zaika-loader-line"><span /></div>
      </div>
    </div>
  );
}
