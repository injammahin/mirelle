export default function Section({ title, action, children, className = '' }) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <h3 className="eyebrow">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
