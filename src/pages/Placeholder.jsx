export default function Placeholder({ icon, title, note }) {
  return (
    <div className="placeholder">
      <div className="big">{icon}</div>
      <h2 style={{ color: 'var(--teal-900)', marginBottom: 6 }}>{title}</h2>
      <div>{note}</div>
    </div>
  )
}
